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

class AdminMoviesPage extends HTMLElement {
  constructor() {
    super();
    this.movies = null;
    this.movieSearch = "";
    this.editingMovieId = null;
    this.movieForm = { ...EMPTY_MOVIE_FORM };
    this.showMovieForm = false;
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
    this.loadMovies();
  }

  render() {
    this.innerHTML = `
      <section class="admin-container">
        <div class="admin-tabs">
          <a href="/admin" data-link class="tab-btn active">Movies</a>
          <a href="/admin/users" data-link class="tab-btn">Users</a>
        </div>

        <div class="admin-panel">
          <div id="movie-message"></div>

          <div class="admin-toolbar">
            <input type="text" id="movie-search" placeholder="Search movies by title..." value="${escapeHtml(this.movieSearch)}" />
            <button id="add-movie-btn" class="btn btn-primary">Add Movie</button>
          </div>

          ${this.showMovieForm ? this.renderMovieForm() : ""}

          <div id="movies-list">
            ${this.renderMoviesList()}
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
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
    if (this.movies === null) {
      return `<p class="admin-hint">Loading movies...</p>`;
    }
    if (this.movies.length === 0) {
      return `<p class="empty-state">No movies found.</p>`;
    }

    const showingAll = Boolean(this.movieSearch);
    const visible = showingAll ? this.movies : this.movies.slice(0, 50);
    const hint = showingAll
      ? ""
      : `<p class="admin-hint">Showing ${visible.length} of ${this.movies.length} movies. Search above to find a specific one.</p>`;

    return `
      ${hint}
      <table class="admin-table">
        <thead>
          <tr><th>Title</th><th>Year</th><th>Rating</th><th></th></tr>
        </thead>
        <tbody>
          ${visible
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

  bindEvents() {
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

    this.bindRowEvents();
  }

  bindRowEvents() {
    this.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => this.startEditMovie(Number(btn.dataset.edit)));
    });
    this.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleDeleteMovie(Number(btn.dataset.delete)));
    });
  }

  async loadMovies() {
    try {
      this.movies = await API.getMovies(this.movieSearch);
    } catch (err) {
      this.movies = [];
      this.showMovieMessage(err.message || "Failed to load movies.", "error");
      return;
    }
    const list = this.querySelector("#movies-list");
    if (!list) return;
    list.innerHTML = this.renderMoviesList();
    this.bindRowEvents();
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

    let successText;
    try {
      if (this.editingMovieId) {
        await API.updateMovie(this.editingMovieId, payload);
        successText = "Movie updated successfully.";
      } else {
        await API.createMovie(payload);
        successText = "Movie created successfully.";
      }
    } catch (err) {
      this.showMovieMessage(err.message || "Failed to save movie.", "error");
      return;
    }

    this.showMovieForm = false;
    this.editingMovieId = null;
    await this.loadMovies();
    this.render();
    this.showMovieMessage(successText, "success");
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
}

customElements.define("admin-movies-page", AdminMoviesPage);
