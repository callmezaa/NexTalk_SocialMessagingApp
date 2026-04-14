package middleware

import (
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// ParseToken returns the user_id from the given JWT token string
func ParseToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is what you expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIdFloat, ok := claims["user_id"].(float64)
		if !ok {
			return 0, fmt.Errorf("user_id not found in token")
		}
		return uint(userIdFloat), nil
	}

	return 0, fmt.Errorf("invalid token")
}
