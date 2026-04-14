package handler

import (
	"log"
	"nextalk/backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

type UploadHandler struct{}

func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		log.Printf("UploadFile Error: No file in form-data: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	src, err := file.Open()
	if err != nil {
		log.Printf("UploadFile Error: Could not open file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not open file"})
	}
	defer src.Close()

	folder := c.Query("folder", "general")
	log.Printf("Uploading file to Cloudinary folder: %s...", folder)

	url, err := services.UploadImage(c.Context(), src, "nextalk/"+folder)
	if err != nil {
		log.Printf("UploadFile Error: Cloudinary upload failed: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Upload to Cloudinary failed: " + err.Error()})
	}

	log.Printf("Upload Success! URL: %s", url)
	return c.JSON(fiber.Map{
		"url": url,
	})
}

func (h *UploadHandler) UploadAudio(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("UploadAudio Error: No file in form-data: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No audio file uploaded"})
	}

	src, err := file.Open()
	if err != nil {
		log.Printf("UploadAudio Error: Could not open file: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not open file"})
	}
	defer src.Close()

	folder := c.Query("folder", "voice")
	log.Printf("Uploading audio to Cloudinary folder: %s...", folder)

	url, err := services.UploadAudio(c.Context(), src, "nextalk/"+folder)
	if err != nil {
		log.Printf("UploadAudio Error: Cloudinary upload failed: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Audio upload failed: " + err.Error()})
	}

	log.Printf("Audio Upload Success! URL: %s", url)
	return c.JSON(fiber.Map{
		"url": url,
	})
}
