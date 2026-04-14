package handler

import (
	"nextalk/backend/internal/models"
	"nextalk/backend/internal/repository"
	"time"

	"github.com/gofiber/fiber/v2"
)

type StoryHandler struct {
	repo *repository.StoryRepository
}

func NewStoryHandler(repo *repository.StoryRepository) *StoryHandler {
	return &StoryHandler{repo: repo}
}

func (h *StoryHandler) CreateStory(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)

	var body struct {
		MediaURL string `json:"media_url"`
		Type     string `json:"type"` // default "image"
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if body.MediaURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Media URL is required"})
	}

	if body.Type == "" {
		body.Type = "image"
	}

	story := models.Story{
		UserID:    userId,
		MediaURL:  body.MediaURL,
		Type:      body.Type,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hours expiration
	}

	if err := h.repo.Create(&story); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create story"})
	}

	return c.Status(fiber.StatusCreated).JSON(story)
}

func (h *StoryHandler) GetStories(c *fiber.Ctx) error {
	// For a simple integration, we fetch all active stories. 
	// In a real app, you would filter by friend connections.
	stories, err := h.repo.GetActiveStories()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch stories"})
	}

	return c.JSON(stories)
}
