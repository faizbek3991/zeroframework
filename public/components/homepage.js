import { API } from "../services/api.js";
import store from "../services/store.js";
import "./movie_item.js";

class HomePage extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `
      <section class="home-container">
        <div class="search-bar-wrapper">
          <input type="text" id="search-input" placeholder="Search movies by title..." />
        </div>
        <div id="movie-grid" class="movie-grid">
          <p class="loading-state">Loading movies...</p>
        </div>
      </section>
    `;

    const searchInput = this.querySelector("#search-input");
    const grid = this.querySelector("#movie-grid");

    const loadMovies = async (term = "") => {
      try {
        const movies = await API.getMovies(term);
        store.movies = movies;
        this.renderGrid(grid, movies);
      } catch (err) {
        grid.innerHTML = `<p class="error-state">Failed to load movies: ${err.message}</p>`;
      }
    };

    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadMovies(e.target.value.trim());
      }, 300);
    });

    loadMovies();
  }

  renderGrid(container, movies) {
    if (!movies || movies.length === 0) {
      container.innerHTML = `<p class="empty-state">No movies found.</p>`;
      return;
    }

    container.innerHTML = "";
    movies.forEach((m) => {
      const item = document.createElement("movie-item");
      item.setAttribute("title", m.title);
      item.setAttribute("year", m.release_year || "N/A");
      item.setAttribute("rating", m.rating || "N/A");
      item.setAttribute("description", m.description || "");
      item.setAttribute("poster", m.poster_url || "");
      container.appendChild(item);
    });
  }
}

customElements.define("home-page", HomePage);