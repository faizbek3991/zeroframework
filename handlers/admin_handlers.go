package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"fullstack-go-vanilla/token"
)

// ListUsers handles GET /api/admin/users
func (h *AccountHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.storage.GetAll()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	writeJSON(w, http.StatusOK, users)
}

type UpdateRoleRequest struct {
	Role string `json:"role"`
}

// UpdateUserRole handles PATCH /api/admin/users/{id}/role
func (h *AccountHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	if req.Role != "admin" && req.Role != "user" {
		writeError(w, http.StatusBadRequest, "Role must be 'admin' or 'user'")
		return
	}

	claims, ok := r.Context().Value(UserContextKey).(*token.Claims)
	if ok && claims.UserID == id {
		writeError(w, http.StatusBadRequest, "You cannot change your own role")
		return
	}

	if err := h.storage.UpdateRole(id, req.Role); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update role")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Role updated successfully"})
}

// DeleteUser handles DELETE /api/admin/users/{id}
func (h *AccountHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	claims, ok := r.Context().Value(UserContextKey).(*token.Claims)
	if ok && claims.UserID == id {
		writeError(w, http.StatusBadRequest, "You cannot delete your own account")
		return
	}

	if err := h.storage.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
