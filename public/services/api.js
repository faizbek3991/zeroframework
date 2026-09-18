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

    if (response.status === 204) {
      return null;
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

  updateMovie(id, movie) {
    return this.request(`/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(movie)
    });
  },

  deleteMovie(id) {
    return this.request(`/movies/${id}`, {
      method: "DELETE"
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
  },

  getUsers() {
    return this.request("/admin/users");
  },

  updateUserRole(id, role) {
    return this.request(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
  },

  deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: "DELETE"
    });
  }
};