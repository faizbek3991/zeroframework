package handlers

import (
	"context"
	"net/http"
	"strings"

	"fullstack-go-vanilla/token"
)

type contextKey string

const UserContextKey contextKey = "userClaims"

// RequireAuth protects routes by verifying the JWT bearer token
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			writeError(w, http.StatusUnauthorized, "Invalid authorization format. Expected: Bearer <token>")
			return
		}

		tokenString := parts[1]
		claims, err := token.ValidateJWT(tokenString)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Inject verified claims into request context for downstream handlers
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next(w, r.WithContext(ctx))
	}
}

// RequireAdmin protects routes by verifying the JWT bearer token and requiring
// the "admin" role. The role is trusted from the JWT rather than re-checked
// against the database, so a role change only takes effect on the user's next
// login (their existing token keeps its old role until it expires).
func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*token.Claims)
		if !ok || claims.Role != "admin" {
			writeError(w, http.StatusForbidden, "Admin access required")
			return
		}
		next(w, r)
	})
}