import { router } from "./services/router.js";
import store from "./services/store.js";
import "./components/homepage.js";
import "./components/login_page.js";
import "./components/forgot_password_page.js";
import "./components/reset_password_page.js";

function updateAuthNav() {
  const nav = document.getElementById("auth-nav");
  if (store.jwt && store.user) {
    nav.innerHTML = `
      <span class="user-greeting">Hi, <strong>${store.user.name}</strong></span>
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