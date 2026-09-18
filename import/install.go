package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found; reading system environment")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to open connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping Neon database: %v", err)
	}
	log.Println("Connected to Neon PostgreSQL successfully.")

	schemaBytes, err := os.ReadFile("import/schema.sql")
	if err != nil {
		log.Fatalf("Failed to read import/schema.sql: %v", err)
	}

	if _, err := db.Exec(string(schemaBytes)); err != nil {
		log.Fatalf("Failed to execute schema: %v", err)
	}

	log.Println("Schema initialized and seeded successfully.")
}
