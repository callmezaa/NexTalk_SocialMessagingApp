package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

type NexBotHandler struct{}

func NewNexBotHandler() *NexBotHandler {
	return &NexBotHandler{}
}

type AskInput struct {
	Prompt string `json:"prompt"`
}

type GroqRequest struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (h *NexBotHandler) Ask(c *fiber.Ctx) error {
	var input AskInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "API Key not configured"})
	}

	groqReq := GroqRequest{
		Model: "llama-3.1-8b-instant",
		Messages: []GroqMessage{
			{Role: "system", Content: "You are NexBot, a professional AI assistant for the NexTalk app. Be helpful, concise, and friendly."},
			{Role: "user", Content: input.Prompt},
		},
	}

	jsonData, err := json.Marshal(groqReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to marshal request"})
	}

	req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create request"})
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to call AI service"})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read response"})
	}

	if resp.StatusCode != http.StatusOK {
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "AI Service error", "details": string(body)})
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to unmarshal AI response"})
	}

	if len(groqResp.Choices) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "No response from AI"})
	}

	return c.JSON(fiber.Map{
		"reply": groqResp.Choices[0].Message.Content,
	})
}
