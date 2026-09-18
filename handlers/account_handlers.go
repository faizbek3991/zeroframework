package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"fullstack-go-vanilla/data"
	"fullstack-go-vanilla/mail"
	"fullstack-go-vanilla/models"
	"fullstack-go-vanilla/token"

	"golang.org/x/crypto/bcrypt"
)

type AccountHandler struct {
	storage data.AccountStorage
}

func NewAccountHandler(storage data.AccountStorage) *AccountHandler {
	return &AccountHandler{storage: storage}
}

type AuthRequest struct {
	Name     string `json:"name,omitempty"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func (h *AccountHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" || req.Name == "" {
		writeError(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}
	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Password must be at least 8 characters")
		return
	}

	existingUser, err := h.storage.GetByEmail(req.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Database lookup error")
		return
	}
	if existingUser != nil {
		writeError(w, http.StatusConflict, "Email is already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Password encryption error")
		return
	}

	user := models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
	}

	if err := h.storage.Create(&user); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to register user")
		return
	}

	jwtToken, err := token.GenerateJWT(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Token generation error")
		return
	}

	writeJSON(w, http.StatusCreated, AuthResponse{Token: jwtToken, User: user})
}

func (h *AccountHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req AuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	user, err := h.storage.GetByEmail(req.Email)
	if err != nil || user == nil {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	jwtToken, err := token.GenerateJWT(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Token generation error")
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{Token: jwtToken, User: *user})
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

// ForgotPassword issues a password reset token and emails a reset link.
// It always responds with a generic success message, whether or not the
// email is registered, to avoid leaking which accounts exist.
func (h *AccountHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	const genericMessage = "If an account exists for that email, a reset link has been sent."
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" {
		writeError(w, http.StatusBadRequest, "Email is required")
		return
	}

	user, err := h.storage.GetByEmail(email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Database lookup error")
		return
	}
	if user == nil {
		writeJSON(w, http.StatusOK, map[string]string{"message": genericMessage})
		return
	}

	resetToken, err := token.GenerateResetToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate reset token")
		return
	}

	if err := h.storage.CreateResetToken(user.ID, resetToken, time.Now().Add(time.Hour)); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create reset token")
		return
	}

	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:" + os.Getenv("PORT")
	}
	resetLink := baseURL + "/reset-password?token=" + resetToken

	if err := mail.SendPasswordResetEmail(user.Email, resetLink); err != nil {
		log.Printf("Failed to send password reset email to %s: %v", user.Email, err)
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": genericMessage})
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

// ResetPassword consumes a reset token and sets a new password for its owner.
func (h *AccountHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Token == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "Token and password are required")
		return
	}
	if len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Password must be at least 8 characters")
		return
	}

	resetToken, err := h.storage.GetResetToken(req.Token)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Database lookup error")
		return
	}
	if resetToken == nil || time.Now().After(resetToken.ExpiresAt) {
		writeError(w, http.StatusBadRequest, "Invalid or expired reset link")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Password encryption error")
		return
	}

	if err := h.storage.UpdatePassword(resetToken.UserID, string(hash)); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	if err := h.storage.DeleteResetToken(req.Token); err != nil {
		log.Printf("Failed to delete used reset token: %v", err)
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Password has been reset successfully."})
}