package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	
	"nextalk/backend/internal/models"
	"nextalk/backend/internal/repository"
	"nextalk/backend/pkg/redis"
)

type Manager struct {
	Clients    map[uint]*Client
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		Clients:    make(map[uint]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (m *Manager) Run() {
	go m.subscribeToRedis()

	for {
		select {
		case client := <-m.Register:
			m.mu.Lock()
			m.Clients[client.UserID] = client
			m.mu.Unlock()
			log.Printf("User %d connected via WS", client.UserID)
			m.setOnlineStatus(client.UserID, true)

		case client := <-m.Unregister:
			m.mu.Lock()
			if _, ok := m.Clients[client.UserID]; ok {
				close(client.Send)
				delete(m.Clients, client.UserID)
			}
			m.mu.Unlock()
			log.Printf("User %d disconnected via WS", client.UserID)
			m.setOnlineStatus(client.UserID, false)
		}
	}
}

func (m *Manager) setOnlineStatus(userId uint, isOnline bool) {
	// Publish online status event
	payload := map[string]interface{}{
		"type": "user_status",
		"payload": map[string]interface{}{
			"user_id": userId,
			"is_online": isOnline,
		},
	}
	bytes, _ := json.Marshal(payload)
	redis.Client.Publish(redis.Ctx, "global_events", bytes)
}

func (m *Manager) HandleClientMessage(msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		return
	}

	userId, hasUserId := msg["user_id"].(uint)
	if !hasUserId {
		log.Println("Missing user_id in WS message handle")
		return
	}

	// Internal repo usage for DB operations
	repo := repository.MessageRepository{}

	switch msgType {
	case "send_message":
		payload, ok := msg["payload"].(map[string]interface{})
		if ok {
			chatIdFloat, _ := payload["chat_id"].(float64)
			content, _ := payload["content"].(string)
			msgTypePayload, _ := payload["type"].(string)
			if msgTypePayload == "" {
				msgTypePayload = "text"
			}
			chatId := uint(chatIdFloat)

			// 1. Save to Postgres
			dbMsg := &models.Message{
				ChatID:   chatId,
				SenderID: userId,
				Content:  content,
				Type:     msgTypePayload,
				Status:   "sent",
			}
			err := repo.CreateMessage(dbMsg)
			if err != nil {
				log.Println("WS Error creating msg DB:", err)
				return // Don't broadcast if DB fails
			}

			// Add the newly created DB id back into the payload for the frontend
			payload["id"] = dbMsg.ID
			payload["sender_id"] = userId
			payload["createdAt"] = dbMsg.CreatedAt
			payload["status"] = "sent"
			msg["payload"] = payload
			
			// FIX: Change type to 'new_message' so front-end Zustand store recognizes the broadcast
			msg["type"] = "new_message"

			// 2. Publish to Redis for other pods/clients
			bytes, _ := json.Marshal(msg)
			channel := fmt.Sprintf("chat:%d", int(chatId))
			
			log.Printf("Successfully saved and broadcasted message to Chat %d", chatId)
			redis.Client.Publish(redis.Ctx, channel, bytes)
		}
	case "typing":
		payload, ok := msg["payload"].(map[string]interface{})
		if ok {
			chatIdFloat, _ := payload["chat_id"].(float64)
			chatId := uint(chatIdFloat)

			// Add user_id to payload so frontend can read it
			payload["user_id"] = userId
			msg["payload"] = payload

			bytes, _ := json.Marshal(msg)
			channel := fmt.Sprintf("chat:%d", int(chatId))
			redis.Client.Publish(redis.Ctx, channel, bytes)
		}
	case "read_messages":
		payload, ok := msg["payload"].(map[string]interface{})
		if ok {
			chatIdFloat, _ := payload["chat_id"].(float64)
			chatId := uint(chatIdFloat)

			// 1. Update status in Postgres
			repo.MarkMessagesAsRead(chatId, userId)

			// 2. Add user_id to payload and broadcast
			payload["user_id"] = userId
			msg["payload"] = payload
			bytes, _ := json.Marshal(msg)
			channel := fmt.Sprintf("chat:%d", int(chatId))
			redis.Client.Publish(redis.Ctx, channel, bytes)
		}
	case "reaction":
		payload, ok := msg["payload"].(map[string]interface{})
		if ok {
			chatIdFloat, _ := payload["chat_id"].(float64)
			msgIdFloat, _ := payload["messageId"].(float64)
			emoji, _ := payload["emoji"].(string)
			chatId := uint(chatIdFloat)

			// 1. Save Reaction to Postgres
			dbReaction := &models.Reaction{
				MessageID: uint(msgIdFloat),
				UserID:    userId,
				Emoji:     emoji,
			}
			repo.AddReaction(dbReaction)

			// 2. Publish to Redis
			bytes, _ := json.Marshal(msg)
			channel := fmt.Sprintf("chat:%d", int(chatId))
			redis.Client.Publish(redis.Ctx, channel, bytes)
		}
	}
}

func (m *Manager) subscribeToRedis() {
	// Subscribe to all chat channels using PSubscribe
	pubsub := redis.Client.PSubscribe(redis.Ctx, "chat:*", "global_events")
	defer pubsub.Close()

	chatRepo := repository.ChatRepository{}

	ch := pubsub.Channel()
	for msg := range ch {
		// Route message to appropriate clients
		if msg.Channel == "global_events" {
			// Broadcast global events to everyone
			m.broadcastToAll([]byte(msg.Payload))
			continue
		}

		// Parse chat ID from channel name (chat:ID)
		var chatId uint
		fmt.Sscanf(msg.Channel, "chat:%d", &chatId)

		if chatId > 0 {
			// Get members of this chat
			members, err := chatRepo.GetChatMembers(chatId)
			if err != nil {
				log.Println("Error fetching chat members for broadcast:", err)
				continue
			}

			// Send only to members of this chat
			m.mu.RLock()
			for _, mData := range members {
				// Get ID from map, handling potential type differences from DB driver
				var memberUID uint
				if idVal, ok := mData["id"]; ok {
					switch v := idVal.(type) {
					case uint: memberUID = v
					case uint32: memberUID = uint(v)
					case uint64: memberUID = uint(v)
					case int: memberUID = uint(v)
					case int32: memberUID = uint(v)
					case int64: memberUID = uint(v)
					}
				}

				if client, ok := m.Clients[memberUID]; ok {
					select {
					case client.Send <- []byte(msg.Payload):
					default:
						// Clean up stale connection logic if needed elsewhere
					}
				}
			}
			m.mu.RUnlock()
		}
	}
}

func (m *Manager) broadcastToAll(payload []byte) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, client := range m.Clients {
		select {
		case client.Send <- payload:
		default:
			// Stale connection cleanup handled in Run() or elsewhere
		}
	}
}
