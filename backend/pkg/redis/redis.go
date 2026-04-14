package redis

import (
	"context"
	"fmt"
	"log"
	"os"

	goredis "github.com/redis/go-redis/v9"
)

var Client *goredis.Client
var Ctx = context.Background()

func Connect() {
	addr := fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT"))
	Client = goredis.NewClient(&goredis.Options{
		Addr:     addr,
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := Client.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("Connected to Redis")
}
