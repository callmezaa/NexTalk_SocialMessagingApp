package repository

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/pkg/database"
)

type MessageRepository struct{}

func (r *MessageRepository) CreateMessage(msg *models.Message) error {
	return database.DB.Create(msg).Error
}

func (r *MessageRepository) GetChatMessages(chatId uint, limit int, offset int) ([]models.Message, error) {
	var messages []models.Message
	err := database.DB.Preload("Reactions").Where("chat_id = ?", chatId).
		Order("created_at desc").Limit(limit).Offset(offset).Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) AddReaction(reaction *models.Reaction) error {
	return database.DB.Create(reaction).Error
}

func (r *MessageRepository) MarkMessagesAsRead(chatId uint, currentUserId uint) error {
	return database.DB.Model(&models.Message{}).
		Where("chat_id = ? AND sender_id != ? AND status != ?", chatId, currentUserId, "read").
		Update("status", "read").Error
}
