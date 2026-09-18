package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"fullstack-go-vanilla/data"
	"fullstack-go-vanilla/models"
)

type MovieHandler struct {
	storage data.MovieStorage
}

func NewMovieHandler(storage data.MovieStorage) *MovieHandler {
	return &MovieHandler{storage: storage}
}

// Helpers for structured JSON output
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, `{"error":"failed to encode response"}`, http.StatusInternalServerError)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// HandleMovies handles GET /api/movies (with optional ?q= search) and POST /api/movies
func (h *MovieHandler) HandleMovies(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		query := r.URL.Query().Get("q")
		var movies []models.Movie
		var err error

		if query != "" {
			movies, err = h.storage.Search(query)
		} else {
			movies, err = h.storage.GetAll()
		}

		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch movies")
			return
		}
		if movies == nil {
			movies = []models.Movie{} // Return empty JSON array [] rather than null
		}
		writeJSON(w, http.StatusOK, movies)

	case http.MethodPost:
		var m models.Movie
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		if m.Title == "" {
			writeError(w, http.StatusBadRequest, "Title is required")
			return
		}

		if err := h.storage.Create(&m); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to create movie")
			return
		}
		writeJSON(w, http.StatusCreated, m)

	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// HandleMovieByID handles GET /api/movies/{id}
func (h *MovieHandler) HandleMovieByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Uses Go 1.22+ standard library path matching pattern
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Invalid movie ID")
		return
	}

	movie, err := h.storage.GetByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve movie")
		return
	}
	if movie == nil {
		writeError(w, http.StatusNotFound, "Movie not found")
		return
	}

	writeJSON(w, http.StatusOK, movie)
}
