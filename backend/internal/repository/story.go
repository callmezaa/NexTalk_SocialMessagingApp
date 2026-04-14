package repository

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/pkg/database"
	"time"
)

type StoryRepository struct{}

func (r *StoryRepository) Create(story *models.Story) error {
	return database.DB.Create(story).Error
}

func (r *StoryRepository) GetActiveStories() ([]models.Story, error) {
	var stories []models.Story
	// Cleanup expired stories first for strict 24h deletion
	r.CleanupExpired()

	err := database.DB.Preload("User").
		Where("expires_at > ?", time.Now()).
		Order("created_at desc").
		Find(&stories).Error
	return stories, err
}

func (r *StoryRepository) GetStoriesByUser(userID uint) ([]models.Story, error) {
	var stories []models.Story
	err := database.DB.Where("user_id = ? AND expires_at > ?", userID, time.Now()).
		Order("created_at desc").
		Find(&stories).Error
	return stories, err
}

func (r *StoryRepository) CleanupExpired() error {
	return database.DB.Where("expires_at < ?", time.Now()).Delete(&models.Story{}).Error
}
