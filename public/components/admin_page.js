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

const EMPTY_MOVIE_FORM = { title: "", description: "", release_year: "", rating: "", poster_url: "" };

class AdminPage extends HTMLElement {
  constructor() {
    super();
    this.activeTab = "movies";
    this.movies = [];
    this.movieSearch = "";
    this.editingMovieId = null;
    this.movieForm = { ...EMPTY_MOVIE_FORM };
    this.showMovieForm = false;
    this.users = [];
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
          <button id="tab-movies" class="tab-btn ${this.activeTab === "movies" ? "active" : ""}">Movies</button>
          <button id="tab-users" class="tab-btn ${this.activeTab === "users" ? "active" : ""}">Users</button>
        </div>

        <div id="movies-panel" class="admin-panel ${this.activeTab === "movies" ? "" : "hidden"}">
          ${this.renderMoviesPanel()}
        </div>

        <div id="users-panel" class="admin-panel ${this.activeTab === "users" ? "" : "hidden"}">
          ${this.renderUsersPanel()}
        </div>
      </section>
    `;

    this.bindTabEvents();
    if (this.activeTab === "movies") {
      this.bindMoviesEvents();
    } else {
      this.bindUsersEvents();
    }
  }

  renderMoviesPanel() {
    return `
      <div id="movie-message"></div>

      <div class="admin-toolbar">
        <input type="text" id="movie-search" placeholder="Search movies by title..." value="${escapeHtml(this.movieSearch)}" />
        <button id="add-movie-btn" class="btn btn-primary">Add Movie</button>
      </div>

      ${this.showMovieForm ? this.renderMovieForm() : ""}

      <div id="movies-list">
        ${this.renderMoviesList()}
      </div>
    `;
  }

  renderMovieForm() {
    const f = this.movieForm;
    return `
      <form id="movie-form" class="admin-form">
        <h3>${this.editingMovieId ? "Edit Movie" : "Add Movie"}</h3>
        <div class="form-group">
          <label for="movie-title">Title</label>
          <input type="text" id="movie-title" required value="${escapeHtml(f.title)}" />
        </div>
        <div class="form-group">
          <label for="movie-description">Description</label>
          <textarea id="movie-description" rows="3">${escapeHtml(f.description)}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label for="movie-year">Release Year</label>
            <input type="number" id="movie-year" value="${escapeHtml(f.release_year)}" />
          </div>
          <div class="form-group">
            <label for="movie-rating">Rating</label>
            <input type="number" step="0.1" min="0" max="10" id="movie-rating" value="${escapeHtml(f.rating)}" />
          </div>
        </div>
        <div class="form-group">
          <label for="movie-poster">Poster URL</label>
          <input type="text" id="movie-poster" value="${escapeHtml(f.poster_url)}" />
        </div>
        <div class="admin-form-actions">
          <button type="submit" class="btn btn-primary">${this.editingMovieId ? "Save Changes" : "Create Movie"}</button>
          <button type="button" id="cancel-movie-form" class="btn btn-outline">Cancel</button>
        </div>
      </form>
    `;
  }

  renderMoviesList() {
    if (!this.movieSearch) {
      return `<p class="admin-hint">Type a title above to search the catalog and manage a movie.</p>`;
    }
    if (this.movies.length === 0) {
      return `<p class="empty-state">No movies found.</p>`;
    }
    return `
      <table class="admin-table">
        <thead>
          <tr><th>Title</th><th>Year</th><th>Rating</th><th></th></tr>
        </thead>
        <tbody>
          ${this.movies
            .map(
              (m) => `
            <tr>
              <td>${escapeHtml(m.title)}</td>
              <td>${escapeHtml(m.release_year ?? "N/A")}</td>
              <td>${escapeHtml(m.rating ?? "N/A")}</td>
              <td class="admin-actions">
                <button class="btn btn-outline btn-small" data-edit="${m.id}">Edit</button>
                <button class="btn btn-outline btn-small btn-danger" data-delete="${m.id}">Delete</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  renderUsersPanel() {
    if (this.users.length === 0) {
      return `<p class="admin-hint">Loading users...</p>`;
    }
    return `
      <div id="user-message"></div>
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

  bindTabEvents() {
    this.querySelector("#tab-movies").addEventListener("click", () => {
      this.activeTab = "movies";
      this.render();
    });
    this.querySelector("#tab-users").addEventListener("click", () => {
      this.activeTab = "users";
      this.render();
    });
  }

  bindMoviesEvents() {
    const searchInput = this.querySelector("#movie-search");
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      this.movieSearch = e.target.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.loadMovies(), 300);
    });

    this.querySelector("#add-movie-btn").addEventListener("click", () => {
      this.editingMovieId = null;
      this.movieForm = { ...EMPTY_MOVIE_FORM };
      this.showMovieForm = true;
      this.render();
    });

    const form = this.querySelector("#movie-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleMovieFormSubmit(e));
      this.querySelector("#cancel-movie-form").addEventListener("click", () => {
        this.showMovieForm = false;
        this.render();
      });
    }

    this.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => this.startEditMovie(Number(btn.dataset.edit)));
    });
    this.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleDeleteMovie(Number(btn.dataset.delete)));
    });
  }

  bindUsersEvents() {
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

  async loadMovies() {
    if (!this.movieSearch) {
      this.movies = [];
      this.querySelector("#movies-list").innerHTML = this.renderMoviesList();
      this.bindMoviesEvents();
      return;
    }
    try {
      this.movies = await API.getMovies(this.movieSearch);
    } catch (err) {
      this.showMovieMessage(err.message || "Failed to load movies.", "error");
      return;
    }
    this.querySelector("#movies-list").innerHTML = this.renderMoviesList();
    this.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => this.startEditMovie(Number(btn.dataset.edit)));
    });
    this.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleDeleteMovie(Number(btn.dataset.delete)));
    });
  }

  startEditMovie(id) {
    const movie = this.movies.find((m) => m.id === id);
    if (!movie) return;
    this.editingMovieId = id;
    this.movieForm = {
      title: movie.title || "",
      description: movie.description || "",
      release_year: movie.release_year ?? "",
      rating: movie.rating ?? "",
      poster_url: movie.poster_url || ""
    };
    this.showMovieForm = true;
    this.render();
  }

  async handleMovieFormSubmit(e) {
    e.preventDefault();
    const title = this.querySelector("#movie-title").value.trim();
    const description = this.querySelector("#movie-description").value.trim();
    const yearRaw = this.querySelector("#movie-year").value;
    const ratingRaw = this.querySelector("#movie-rating").value;
    const posterURL = this.querySelector("#movie-poster").value.trim();

    const payload = {
      title,
      description: description || null,
      release_year: yearRaw ? Number(yearRaw) : null,
      rating: ratingRaw ? Number(ratingRaw) : null,
      poster_url: posterURL || null
    };

    try {
      if (this.editingMovieId) {
        await API.updateMovie(this.editingMovieId, payload);
        this.showMovieMessage("Movie updated successfully.", "success");
      } else {
        await API.createMovie(payload);
        this.showMovieMessage("Movie created successfully.", "success");
      }
      this.showMovieForm = false;
      this.editingMovieId = null;
      await this.loadMovies();
      this.render();
    } catch (err) {
      this.showMovieMessage(err.message || "Failed to save movie.", "error");
    }
  }

  async handleDeleteMovie(id) {
    if (!confirm("Delete this movie? This cannot be undone.")) return;
    try {
      await API.deleteMovie(id);
      await this.loadMovies();
      this.showMovieMessage("Movie deleted.", "success");
    } catch (err) {
      this.showMovieMessage(err.message || "Failed to delete movie.", "error");
    }
  }

  showMovieMessage(text, type) {
    const box = this.querySelector("#movie-message");
    if (!box) return;
    box.innerHTML = `<div class="${type === "error" ? "auth-error" : "auth-success"}">${escapeHtml(text)}</div>`;
  }

  async loadUsers() {
    try {
      this.users = await API.getUsers();
    } catch (err) {
      this.users = [];
      this.querySelector("#users-panel").innerHTML = `<div class="auth-error">${escapeHtml(
        err.message || "Failed to load users."
      )}</div>`;
      return;
    }
    if (this.activeTab === "users") {
      this.querySelector("#users-panel").innerHTML = this.renderUsersPanel();
      this.bindUsersEvents();
    }
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

customElements.define("admin-page", AdminPage);
