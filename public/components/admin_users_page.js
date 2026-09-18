import { API } from "../services/api.js";
import store from "../services/store.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class AdminUsersPage extends HTMLElement {
  constructor() {
    super();
    this.users = null;
  }

  connectedCallback() {
    if (!store.user || store.user.role !== "admin") {
      this.innerHTML = `
        <section class="admin-container">
          <div class="auth-error">Admin access required. <a href="/" data-link>Go back home</a></div>
        </section>
      `;
      return;
    }
    this.render();
    this.loadUsers();
  }

  render() {
    this.innerHTML = `
      <section class="admin-container">
        <div class="admin-tabs">
          <a href="/admin" data-link class="tab-btn">Movies</a>
          <a href="/admin/users" data-link class="tab-btn active">Users</a>
        </div>

        <div class="admin-panel">
          <div id="user-message"></div>
          <div id="users-list">
            ${this.renderUsersList()}
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
  }

  renderUsersList() {
    if (this.users === null) {
      return `<p class="admin-hint">Loading users...</p>`;
    }
    return `
      <table class="admin-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
        </thead>
        <tbody>
          ${this.users
            .map((u) => {
              const isSelf = store.user && store.user.id === u.id;
              return `
              <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="role-badge role-${escapeHtml(u.role)}">${escapeHtml(u.role)}</span></td>
                <td class="admin-actions">
                  ${
                    isSelf
                      ? `<span class="admin-hint">(you)</span>`
                      : `
                    <button class="btn btn-outline btn-small" data-toggle-role="${u.id}" data-current-role="${escapeHtml(u.role)}">
                      ${u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button class="btn btn-outline btn-small btn-danger" data-delete-user="${u.id}">Delete</button>
                  `
                  }
                </td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    `;
  }

  bindEvents() {
    this.bindRowEvents();
  }

  bindRowEvents() {
    this.querySelectorAll("[data-toggle-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.toggleRole);
        const newRole = btn.dataset.currentRole === "admin" ? "user" : "admin";
        this.handleRoleToggle(id, newRole);
      });
    });
    this.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleDeleteUser(Number(btn.dataset.deleteUser)));
    });
  }

  async loadUsers() {
    try {
      this.users = await API.getUsers();
    } catch (err) {
      this.users = [];
      const box = this.querySelector("#users-list");
      if (box) box.innerHTML = `<div class="auth-error">${escapeHtml(err.message || "Failed to load users.")}</div>`;
      return;
    }
    const box = this.querySelector("#users-list");
    if (!box) return;
    box.innerHTML = this.renderUsersList();
    this.bindRowEvents();
  }

  async handleRoleToggle(id, newRole) {
    try {
      await API.updateUserRole(id, newRole);
      await this.loadUsers();
      this.showUserMessage(`Role updated to ${newRole}.`, "success");
    } catch (err) {
      this.showUserMessage(err.message || "Failed to update role.", "error");
    }
  }

  async handleDeleteUser(id) {
    if (!confirm("Delete this user account? This cannot be undone.")) return;
    try {
      await API.deleteUser(id);
      await this.loadUsers();
      this.showUserMessage("User deleted.", "success");
    } catch (err) {
      this.showUserMessage(err.message || "Failed to delete user.", "error");
    }
  }

  showUserMessage(text, type) {
    const box = this.querySelector("#user-message");
    if (!box) return;
    box.innerHTML = `<div class="${type === "error" ? "auth-error" : "auth-success"}">${escapeHtml(text)}</div>`;
  }
}

customElements.define("admin-users-page", AdminUsersPage);
