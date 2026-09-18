package models

import "time"

type Movie struct {
	ID          int        `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description,omitempty" db:"description"`
	ReleaseYear *int       `json:"release_year,omitempty" db:"release_year"`
	Rating      *float64   `json:"rating,omitempty" db:"rating"`
	PosterURL   *string    `json:"poster_url,omitempty" db:"poster_url"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}