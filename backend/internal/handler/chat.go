package handler

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/internal/repository"
	"nextalk/backend/pkg/database"

	"github.com/gofiber/fiber/v2"
)

type ChatHandler struct {
	chatRepo *repository.ChatRepository
}

func NewChatHandler(repo *repository.ChatRepository) *ChatHandler {
	return &ChatHandler{chatRepo: repo}
}

type ChatResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Avatar      string `json:"avatar"`
	LastMessage string `json:"lastMessage"`
	Time        string `json:"time"`
	Unread      int    `json:"unread"`
	IsGroup     bool   `json:"isGroup"`
	Status      string `json:"status"`
	Online      bool   `json:"online"`
}

func (h *ChatHandler) GetChats(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)

	chats, err := h.chatRepo.GetUserChats(userId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch chats"})
	}

	response := []ChatResponse{}
	for _, chat := range chats {
		res := ChatResponse{
			ID:      chat.ID,
			IsGroup: chat.IsGroup,
			Name:    chat.Name,
		}

		if chat.IsGroup {
			// For group chats, use the group's own avatar
			res.Avatar = chat.AvatarURL
		} else {
			// For 1-to-1, get other member profile
			other, err := h.chatRepo.GetOtherMember(chat.ID, userId)
			if err == nil {
				res.Name = other.Username
				res.Avatar = other.AvatarURL
				res.Online = other.IsOnline
			}
		}

		// Get last message
		lastMsg, err := h.chatRepo.GetLastMessage(chat.ID)
		if err == nil {
			res.LastMessage = lastMsg.Content
			res.Time = lastMsg.CreatedAt.Format("15:04 PM")
			res.Status = lastMsg.Status
		}

		response = append(response, res)
	}

	return c.JSON(response)
}

func (h *ChatHandler) CreateChat(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)

	var body struct {
		TargetUserID uint `json:"target_user_id"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if userId == body.TargetUserID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot chat with yourself"})
	}

	// Check if chat already exists
	existing, err := h.chatRepo.GetPrivateChatBetweenUsers(userId, body.TargetUserID)
	if err == nil {
		return c.JSON(existing)
	}

	// Create new chat
	newChat := models.Chat{
		IsGroup: false,
	}
	if err := h.chatRepo.CreateChat(&newChat); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create chat"})
	}

	// Add members
	h.chatRepo.AddMember(&models.ChatMember{ChatID: newChat.ID, UserID: userId})
	h.chatRepo.AddMember(&models.ChatMember{ChatID: newChat.ID, UserID: body.TargetUserID})

	return c.Status(fiber.StatusCreated).JSON(newChat)
}
func (h *ChatHandler) CreateGroup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)

	var body struct {
		Name           string `json:"name"`
		Description    string `json:"description"`
		AvatarURL      string `json:"avatar_url"`
		ParticipantIDs []uint `json:"participant_ids"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Group name is required"})
	}

	// Create new chat
	newChat := models.Chat{
		Name:        body.Name,
		Description: body.Description,
		AvatarURL:   body.AvatarURL,
		IsGroup:     true,
	}
	if err := h.chatRepo.CreateChat(&newChat); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create group"})
	}

	// Add creator as admin
	h.chatRepo.AddMember(&models.ChatMember{
		ChatID: newChat.ID,
		UserID: userId,
		Role:   "admin",
	})

	// Add other participants
	for _, pId := range body.ParticipantIDs {
		if pId == userId {
			continue // Already added as admin
		}
		h.chatRepo.AddMember(&models.ChatMember{
			ChatID: newChat.ID,
			UserID: pId,
			Role:   "member",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(newChat)
}

func (h *ChatHandler) GetChatInfo(c *fiber.Ctx) error {
	chatId, _ := c.ParamsInt("chatId")

	// Get Chat metadata
	var chat models.Chat
	if err := database.DB.First(&chat, chatId).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Chat not found"})
	}

	// Get members
	members, err := h.chatRepo.GetChatMembers(uint(chatId))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch members"})
	}

	return c.JSON(fiber.Map{
		"id":          chat.ID,
		"name":        chat.Name,
		"description": chat.Description,
		"avatar_url":  chat.AvatarURL,
		"is_group":    chat.IsGroup,
		"created_at":  chat.CreatedAt,
		"members":     members,
	})
}

func (h *ChatHandler) LeaveGroup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)
	chatId, _ := c.ParamsInt("chatId")

	if err := h.chatRepo.RemoveMember(uint(chatId), userId); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to leave group"})
	}

	return c.JSON(fiber.Map{"message": "Successfully left group"})
}

func (h *ChatHandler) AddMembersToGroup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)
	chatId, _ := c.ParamsInt("chatId")

	var body struct {
		MemberIDs []uint `json:"member_ids"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Verify the requesting user is a member of this group
	if !h.chatRepo.IsMember(uint(chatId), userId) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You are not a member of this group"})
	}

	addedCount := 0
	for _, memberId := range body.MemberIDs {
		if h.chatRepo.IsMember(uint(chatId), memberId) {
			continue // Skip if already a member
		}
		err := h.chatRepo.AddMember(&models.ChatMember{
			ChatID: uint(chatId),
			UserID: memberId,
			Role:   "member",
		})
		if err == nil {
			addedCount++
		}
	}

	return c.JSON(fiber.Map{"message": "Members added successfully", "added": addedCount})
}

func (h *ChatHandler) RemoveMemberFromGroup(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)
	chatId, _ := c.ParamsInt("chatId")
	targetUserId, _ := c.ParamsInt("userId")

	// Verify the requesting user is admin
	role, err := h.chatRepo.GetMemberRole(uint(chatId), userId)
	if err != nil || role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Only admins can remove members"})
	}

	// Prevent admin from removing themselves via this route
	if userId == uint(targetUserId) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Use leave group instead"})
	}

	if err := h.chatRepo.RemoveMember(uint(chatId), uint(targetUserId)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove member"})
	}

	return c.JSON(fiber.Map{"message": "Member removed successfully"})
}
