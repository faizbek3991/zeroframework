package token

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateResetToken returns a random 32-byte hex-encoded token for password resets.
func GenerateResetToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
