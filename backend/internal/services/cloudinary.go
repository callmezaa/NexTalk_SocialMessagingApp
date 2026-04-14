package services

import (
	"context"
	"log"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var CLD *cloudinary.Cloudinary

func InitCloudinary() {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	log.Printf("Initializing Cloudinary with CloudName: %s, APIKey: %s (first 3 chars)", cloudName, apiKey[:3])

	var err error
	CLD, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		log.Printf("CRITICAL: Failed to initialize Cloudinary: %v", err)
		panic("Failed to initialize Cloudinary: " + err.Error())
	}
}

func UploadImage(ctx context.Context, file interface{}, folder string) (string, error) {
	if CLD == nil {
		InitCloudinary()
	}

	result, err := CLD.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: folder,
	})
	if err != nil {
		log.Printf("Cloudinary SDK Upload Error: %v", err)
		return "", err
	}

	return result.SecureURL, nil
}

func UploadAudio(ctx context.Context, file interface{}, folder string) (string, error) {
	if CLD == nil {
		InitCloudinary()
	}

	result, err := CLD.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       folder,
		ResourceType: "video", // Cloudinary uses 'video' for audio files
	})
	if err != nil {
		log.Printf("Cloudinary Audio Upload Error: %v", err)
		return "", err
	}

	return result.SecureURL, nil
}
