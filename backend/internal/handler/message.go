package handler

import (
	"nextalk/backend/internal/repository"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type MessageHandler struct {
	messageRepo *repository.MessageRepository
}

func NewMessageHandler(repo *repository.MessageRepository) *MessageHandler {
	return &MessageHandler{messageRepo: repo}
}

func (h *MessageHandler) GetMessages(c *fiber.Ctx) error {
	chatIdStr := c.Params("chatId")
	chatId, err := strconv.ParseUint(chatIdStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid chat ID"})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	messages, err := h.messageRepo.GetChatMessages(uint(chatId), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch messages"})
	}

	return c.JSON(messages)
}
