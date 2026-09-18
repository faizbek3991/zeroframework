package data

import (
	"time"

	"fullstack-go-vanilla/models"
)

// MovieStorage defines contracts for movie data retrieval and manipulation
type MovieStorage interface {
	GetAll() ([]models.Movie, error)
	GetByID(id int) (*models.Movie, error)
	Create(movie *models.Movie) error
	Update(movie *models.Movie) error
	Delete(id int) error
	Search(query string) ([]models.Movie, error)
}

// AccountStorage defines contracts for user registration and authentication
type AccountStorage interface {
	GetByEmail(email string) (*models.User, error)
	Create(user *models.User) error
	UpdatePassword(userID int, passwordHash string) error
	CreateResetToken(userID int, token string, expiresAt time.Time) error
	GetResetToken(token string) (*models.PasswordResetToken, error)
	DeleteResetToken(token string) error
	GetAll() ([]models.User, error)
	UpdateRole(userID int, role string) error
	Delete(userID int) error
}