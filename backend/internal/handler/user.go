package handler

import (
	"nextalk/backend/internal/repository"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: repo}
}

func (h *UserHandler) SearchUsers(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)
	query := c.Query("q")

	if query == "" {
		return c.JSON([]interface{}{})
	}

	users, err := h.userRepo.SearchUsers(query, userId)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to search users"})
	}

	return c.JSON(users)
}

func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userId := c.Locals("user_id").(uint)
	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Filter allowed fields for security
	allowed := map[string]interface{}{}
	if val, ok := updates["avatar"]; ok {
		allowed["avatar_url"] = val
	}
	if val, ok := updates["bio"]; ok {
		allowed["bio"] = val
	}

	err := h.userRepo.UpdateProfile(userId, allowed)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profile updated successfully"})
}
