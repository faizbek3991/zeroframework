package data

import (
	"database/sql"
	"errors"

	"fullstack-go-vanilla/models"
)

var ErrNotFound = errors.New("not found")

type MovieRepository struct {
	DB *sql.DB
}

func NewMovieRepository(db *sql.DB) *MovieRepository {
	return &MovieRepository{DB: db}
}

func (r *MovieRepository) GetAll() ([]models.Movie, error) {
	query := `
		SELECT id, title, description, release_year, rating, poster_url, created_at 
		FROM movies 
		ORDER BY id ASC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []models.Movie
	for rows.Next() {
		var m models.Movie
		if err := rows.Scan(
			&m.ID,
			&m.Title,
			&m.Description,
			&m.ReleaseYear,
			&m.Rating,
			&m.PosterURL,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		movies = append(movies, m)
	}

	return movies, rows.Err()
}

func (r *MovieRepository) GetByID(id int) (*models.Movie, error) {
	query := `
		SELECT id, title, description, release_year, rating, poster_url, created_at 
		FROM movies 
		WHERE id = $1
	`
	var m models.Movie
	err := r.DB.QueryRow(query, id).Scan(
		&m.ID,
		&m.Title,
		&m.Description,
		&m.ReleaseYear,
		&m.Rating,
		&m.PosterURL,
		&m.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MovieRepository) Create(movie *models.Movie) error {
	query := `
		INSERT INTO movies (title, description, release_year, rating, poster_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	return r.DB.QueryRow(
		query,
		movie.Title,
		movie.Description,
		movie.ReleaseYear,
		movie.Rating,
		movie.PosterURL,
	).Scan(&movie.ID, &movie.CreatedAt)
}

func (r *MovieRepository) Update(movie *models.Movie) error {
	query := `
		UPDATE movies
		SET title = $1, description = $2, release_year = $3, rating = $4, poster_url = $5
		WHERE id = $6
		RETURNING created_at
	`
	err := r.DB.QueryRow(
		query,
		movie.Title,
		movie.Description,
		movie.ReleaseYear,
		movie.Rating,
		movie.PosterURL,
		movie.ID,
	).Scan(&movie.CreatedAt)
	if err == sql.ErrNoRows {
		return ErrNotFound
	}
	return err
}

func (r *MovieRepository) Delete(id int) error {
	result, err := r.DB.Exec(`DELETE FROM movies WHERE id = $1`, id)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MovieRepository) Search(term string) ([]models.Movie, error) {
	query := `
		SELECT id, title, description, release_year, rating, poster_url, created_at 
		FROM movies 
		WHERE title ILIKE $1
		ORDER BY id ASC
	`
	rows, err := r.DB.Query(query, "%"+term+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []models.Movie
	for rows.Next() {
		var m models.Movie
		if err := rows.Scan(
			&m.ID,
			&m.Title,
			&m.Description,
			&m.ReleaseYear,
			&m.Rating,
			&m.PosterURL,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		movies = append(movies, m)
	}

	return movies, rows.Err()
}