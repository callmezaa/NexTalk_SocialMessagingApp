package database

import (
	"fmt"
	"log"
	"os"

	"nextalk/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Connected to Database")
}

func Migrate() {
	err := DB.AutoMigrate(&models.User{}, &models.Chat{}, &models.ChatMember{}, &models.Message{}, &models.Reaction{}, &models.Story{})
	if err != nil {
		log.Fatal("Failed to migrate database. \n", err)
	}
	log.Println("Database Migrated")
}
