import store from "./store.js";

const BASE_URL = "/api";

export const API = {
  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (store.jwt) {
      headers["Authorization"] = `Bearer ${store.jwt}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return response.json();
  },

  getMovies(query = "") {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request(`/movies${qs}`);
  },

  getMovieByID(id) {
    return this.request(`/movies/${id}`);
  },

  createMovie(movie) {
    return this.request("/movies", {
      method: "POST",
      body: JSON.stringify(movie)
    });
  },

  login(email, password) {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  register(name, email, password) {
    return this.request("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },

  forgotPassword(email) {
    return this.request("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  resetPassword(token, password) {
    return this.request("/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  }
};