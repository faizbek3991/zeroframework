package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"fullstack-go-vanilla/data"
	"fullstack-go-vanilla/handlers"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found; using system environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL must be set in .env")
	}

	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET must be set in .env")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to initialize database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection established successfully")

	// Repositories
	movieRepo := data.NewMovieRepository(db)
	accountRepo := data.NewAccountRepository(db)

	// Handlers
	movieHandler := handlers.NewMovieHandler(movieRepo)
	accountHandler := handlers.NewAccountHandler(accountRepo)

	// Router
	mux := http.NewServeMux()

	// Auth Endpoints (Public)
	mux.HandleFunc("POST /api/register", accountHandler.Register)
	mux.HandleFunc("POST /api/login", accountHandler.Login)
	mux.HandleFunc("POST /api/forgot-password", accountHandler.ForgotPassword)
	mux.HandleFunc("POST /api/reset-password", accountHandler.ResetPassword)

	// Movie Endpoints (Public Read, Admin-Only Write)
	mux.HandleFunc("GET /api/movies", movieHandler.HandleMovies)
	mux.HandleFunc("GET /api/movies/{id}", movieHandler.HandleMovieByID)
	mux.HandleFunc("POST /api/movies", handlers.RequireAdmin(movieHandler.HandleMovies))
	mux.HandleFunc("PUT /api/movies/{id}", handlers.RequireAdmin(movieHandler.HandleMovieByID))
	mux.HandleFunc("DELETE /api/movies/{id}", handlers.RequireAdmin(movieHandler.HandleMovieByID))

	// Admin Endpoints (Admin-Only)
	mux.HandleFunc("GET /api/admin/users", handlers.RequireAdmin(accountHandler.ListUsers))
	mux.HandleFunc("PATCH /api/admin/users/{id}/role", handlers.RequireAdmin(accountHandler.UpdateUserRole))
	mux.HandleFunc("DELETE /api/admin/users/{id}", handlers.RequireAdmin(accountHandler.DeleteUser))

	// SPA Static Fallback
	fs := http.FileServer(http.Dir("./public"))
	mux.Handle("/", fs)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}