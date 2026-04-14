package repository

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/pkg/database"
)

type UserRepository struct{}

func (r *UserRepository) Create(user *models.User) error {
	return database.DB.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) UpdateStatus(id uint, isOnline bool) error {
	return database.DB.Model(&models.User{}).Where("id = ?", id).Update("is_online", isOnline).Error
}

func (r *UserRepository) SearchUsers(query string, excludeID uint) ([]models.User, error) {
	var users []models.User
	err := database.DB.Where("(username ILIKE ? OR email ILIKE ?) AND id != ?", "%"+query+"%", "%"+query+"%", excludeID).
		Limit(20).
		Find(&users).Error
	return users, err
}

func (r *UserRepository) UpdateProfile(id uint, updates map[string]interface{}) error {
	return database.DB.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error
}
