package main

import (
	"log"

	"nextalk/backend/internal/handler"
	"nextalk/backend/internal/middleware"
	"nextalk/backend/internal/models"
	"nextalk/backend/internal/repository"
	"nextalk/backend/internal/ws"
	"nextalk/backend/internal/services"
	"nextalk/backend/pkg/database"
	"nextalk/backend/pkg/redis"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	database.Connect()
	database.Migrate()

	// Seed Dummy Chats to avoid Foreign Key errors
	seedChats()

	redis.Connect()
	services.InitCloudinary()

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Handlers
	userRepo := &repository.UserRepository{}
	authHandler := handler.NewAuthHandler(userRepo)
	userHandler := handler.NewUserHandler(userRepo)

	chatRepo := &repository.ChatRepository{}
	chatHandler := handler.NewChatHandler(chatRepo)

	messageRepo := &repository.MessageRepository{}
	messageHandler := handler.NewMessageHandler(messageRepo)

	storyRepo := &repository.StoryRepository{}
	storyHandler := handler.NewStoryHandler(storyRepo)

	wsManager := ws.NewManager()
	go wsManager.Run()

	api := app.Group("/api")
	
	// Auth routes
	api.Post("/register", authHandler.Register)
	api.Post("/login", authHandler.Login)

	// NexBot route (Protected)
	nexBotHandler := handler.NewNexBotHandler()
	api.Post("/nexbot/ask", middleware.Protected(), nexBotHandler.Ask)

	// Chat & Message routes (Protected)
	api.Get("/chats", middleware.Protected(), chatHandler.GetChats)
	api.Post("/chats", middleware.Protected(), chatHandler.CreateChat)
	api.Post("/groups", middleware.Protected(), chatHandler.CreateGroup)
	api.Post("/chats/:chatId/leave", middleware.Protected(), chatHandler.LeaveGroup)
	api.Get("/chats/:chatId/info", middleware.Protected(), chatHandler.GetChatInfo)
	api.Post("/chats/:chatId/members", middleware.Protected(), chatHandler.AddMembersToGroup)
	api.Delete("/chats/:chatId/members/:userId", middleware.Protected(), chatHandler.RemoveMemberFromGroup)
	uploadHandler := &handler.UploadHandler{}
	api.Post("/upload", middleware.Protected(), uploadHandler.UploadFile)
	api.Post("/upload/audio", middleware.Protected(), uploadHandler.UploadAudio)
	api.Get("/messages/:chatId", middleware.Protected(), messageHandler.GetMessages)

	// User routes
	api.Get("/users/search", middleware.Protected(), userHandler.SearchUsers)
	api.Patch("/users/profile", middleware.Protected(), userHandler.UpdateProfile)

	// Story routes
	api.Post("/stories", middleware.Protected(), storyHandler.CreateStory)
	api.Get("/stories", middleware.Protected(), storyHandler.GetStories)

	// WebSocket Route (Protected by Middleware if desired, but Fiber websocket upgrades with JWT in query or headers)
	// For simplicity, checking query parameter token in a middleware or inside the WS handler
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		tokenString := c.Query("token")
		userId, err := middleware.ParseToken(tokenString)
		if err != nil {
			log.Println("Invalid WS Token:", err)
			c.Close()
			return
		}

		client := &ws.Client{
			Manager: wsManager,
			Conn:    c,
			UserID:  userId,
			Send:    make(chan []byte, 256),
		}

		client.Manager.Register <- client

		go client.WritePump()
		client.ReadPump()
	}))

	log.Fatal(app.Listen(":3000"))
}

func seedChats() {
	// Seed dummy chats with IDs 1, 2, 3 so front-end mock UI doesn't crash Postgres FK constraint
	// when sending messages.
	dummyChats := []models.Chat{
		{ID: 1, Name: "Alice Smith", IsGroup: false},
		{ID: 2, Name: "Engineering Team", IsGroup: true},
		{ID: 3, Name: "Bob Johnson", IsGroup: false},
	}

	for _, chat := range dummyChats {
		var existing models.Chat
		if err := database.DB.First(&existing, chat.ID).Error; err != nil {
			// Doesn't exist, create it
			database.DB.Create(&chat)
		}
	}
}
