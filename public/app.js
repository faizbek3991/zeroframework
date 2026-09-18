import { router } from "./services/router.js";
import store from "./services/store.js";
import "./components/homepage.js";
import "./components/login_page.js";
import "./components/forgot_password_page.js";
import "./components/reset_password_page.js";
import "./components/admin_movies_page.js";
import "./components/admin_users_page.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateAuthNav() {
  const nav = document.getElementById("auth-nav");
  if (store.jwt && store.user) {
    const adminLink =
      store.user.role === "admin" ? `<a href="/admin" data-link class="btn btn-outline">Admin</a>` : "";
    nav.innerHTML = `
      <span class="user-greeting">Hi, <strong>${escapeHtml(store.user.name)}</strong></span>
      ${adminLink}
      <button id="logout-btn" class="btn btn-outline">Logout</button>
    `;
    nav.querySelector("#logout-btn").addEventListener("click", () => {
      store.jwt = null;
      store.user = null;
      router.go("/");
    });
  } else {
    nav.innerHTML = `
      <a href="/login" data-link class="btn btn-primary">Sign In</a>
    `;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  router.init();
  updateAuthNav();
  window.addEventListener("storechange", () => updateAuthNav());
});