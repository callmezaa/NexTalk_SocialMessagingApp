package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;not null" json:"username"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Bio          string    `json:"bio"`
	AvatarURL    string    `json:"avatar_url"`
	LastSeen     time.Time `json:"last_seen"`
	IsOnline     bool      `gorm:"default:false" json:"is_online"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Chat struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"` // Used if IsGroup is true
	IsGroup     bool      `gorm:"default:false" json:"is_group"`
	AvatarURL   string    `json:"avatar_url"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type ChatMember struct {
	ChatID    uint      `gorm:"primaryKey" json:"chat_id"`
	UserID    uint      `gorm:"primaryKey" json:"user_id"`
	Role      string    `gorm:"default:'member'" json:"role"` // admin or member
	JoinedAt  time.Time `json:"joined_at"`
}

type Message struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	ChatID    uint       `gorm:"index;not null" json:"chat_id"`
	SenderID  uint       `gorm:"index;not null" json:"sender_id"`
	Content   string     `gorm:"not null" json:"content"`
	Type      string     `gorm:"default:'text'" json:"type"` // text, image
	Status    string     `gorm:"default:'sent'" json:"status"` // sent, delivered, read
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	Reactions []Reaction `gorm:"foreignKey:MessageID" json:"reactions,omitempty"`
}

type Reaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MessageID uint      `gorm:"index;not null" json:"message_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Emoji     string    `gorm:"not null" json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

type Story struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	MediaURL  string    `gorm:"not null" json:"media_url"`
	Type      string    `gorm:"default:'image'" json:"type"`
	ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
