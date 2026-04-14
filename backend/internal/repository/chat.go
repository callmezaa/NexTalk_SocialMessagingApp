package repository

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/pkg/database"
)

type ChatRepository struct{}

func (r *ChatRepository) CreateChat(chat *models.Chat) error {
	return database.DB.Create(chat).Error
}

func (r *ChatRepository) AddMember(member *models.ChatMember) error {
	return database.DB.Create(member).Error
}

func (r *ChatRepository) GetUserChats(userId uint) ([]models.Chat, error) {
	var chats []models.Chat
	err := database.DB.Joins("JOIN chat_members ON chat_members.chat_id = chats.id").
		Where("chat_members.user_id = ?", userId).
		Order("chats.created_at desc").
		Find(&chats).Error
	return chats, err
}

func (r *ChatRepository) GetOtherMember(chatId uint, currentUserId uint) (*models.User, error) {
	var user models.User
	err := database.DB.Joins("JOIN chat_members ON chat_members.user_id = users.id").
		Where("chat_members.chat_id = ? AND chat_members.user_id != ?", chatId, currentUserId).
		First(&user).Error
	return &user, err
}

func (r *ChatRepository) GetLastMessage(chatId uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.Where("chat_id = ?", chatId).Order("created_at desc").First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *ChatRepository) GetPrivateChatBetweenUsers(user1, user2 uint) (*models.Chat, error) {
	var chat models.Chat
	err := database.DB.Raw(`
		SELECT c.* FROM chats c
		JOIN chat_members cm1 ON c.id = cm1.chat_id
		JOIN chat_members cm2 ON c.id = cm2.chat_id
		WHERE c.is_group = false 
		AND cm1.user_id = ? 
		AND cm2.user_id = ?
	`, user1, user2).First(&chat).Error
	if err != nil {
		return nil, err
	}
	return &chat, nil
}

func (r *ChatRepository) GetChatMembers(chatId uint) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := database.DB.Table("chat_members").
		Select("users.id, users.username, users.avatar_url, users.bio, users.is_online, chat_members.role").
		Joins("JOIN users ON users.id = chat_members.user_id").
		Where("chat_members.chat_id = ?", chatId).
		Scan(&results).Error
	return results, err
}

func (r *ChatRepository) RemoveMember(chatId, userId uint) error {
	return database.DB.Where("chat_id = ? AND user_id = ?", chatId, userId).Delete(&models.ChatMember{}).Error
}

func (r *ChatRepository) GetMemberRole(chatId, userId uint) (string, error) {
	var member models.ChatMember
	err := database.DB.Where("chat_id = ? AND user_id = ?", chatId, userId).First(&member).Error
	if err != nil {
		return "", err
	}
	return member.Role, nil
}

func (r *ChatRepository) IsMember(chatId, userId uint) bool {
	var count int64
	database.DB.Model(&models.ChatMember{}).Where("chat_id = ? AND user_id = ?", chatId, userId).Count(&count)
	return count > 0
}
