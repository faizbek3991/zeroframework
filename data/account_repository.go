package data

import (
	"database/sql"
	"time"

	"fullstack-go-vanilla/models"
)

type AccountRepository struct {
	DB *sql.DB
}

func NewAccountRepository(db *sql.DB) *AccountRepository {
	return &AccountRepository{DB: db}
}

func (r *AccountRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, role, created_at
	`
	return r.DB.QueryRow(query, user.Name, user.Email, user.PasswordHash).Scan(&user.ID, &user.Role, &user.CreatedAt)
}

func (r *AccountRepository) GetByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, name, email, password_hash, role, created_at
		FROM users
		WHERE email = $1
	`
	var u models.User
	err := r.DB.QueryRow(query, email).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *AccountRepository) GetAll() ([]models.User, error) {
	query := `SELECT id, name, email, role, created_at FROM users ORDER BY id ASC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *AccountRepository) UpdateRole(userID int, role string) error {
	_, err := r.DB.Exec(`UPDATE users SET role = $1 WHERE id = $2`, role, userID)
	return err
}

func (r *AccountRepository) Delete(userID int) error {
	_, err := r.DB.Exec(`DELETE FROM users WHERE id = $1`, userID)
	return err
}

func (r *AccountRepository) UpdatePassword(userID int, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`
	_, err := r.DB.Exec(query, passwordHash, userID)
	return err
}

func (r *AccountRepository) CreateResetToken(userID int, token string, expiresAt time.Time) error {
	query := `
		INSERT INTO password_reset_tokens (token, user_id, expires_at)
		VALUES ($1, $2, $3)
	`
	_, err := r.DB.Exec(query, token, userID, expiresAt)
	return err
}

func (r *AccountRepository) GetResetToken(token string) (*models.PasswordResetToken, error) {
	query := `
		SELECT token, user_id, expires_at, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`
	var t models.PasswordResetToken
	err := r.DB.QueryRow(query, token).Scan(&t.Token, &t.UserID, &t.ExpiresAt, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *AccountRepository) DeleteResetToken(token string) error {
	query := `DELETE FROM password_reset_tokens WHERE token = $1`
	_, err := r.DB.Exec(query, token)
	return err
}