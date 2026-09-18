import { API } from "../services/api.js";
import store from "../services/store.js";
import { router } from "../services/router.js";

class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.isRegisterMode = false;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <section class="auth-container">
        <div class="auth-card">
          <div class="auth-tabs">
            <button id="tab-login" class="tab-btn ${!this.isRegisterMode ? "active" : ""}">Sign In</button>
            <button id="tab-register" class="tab-btn ${this.isRegisterMode ? "active" : ""}">Sign Up</button>
          </div>

          <form id="auth-form" class="auth-form">
            <div id="auth-error" class="auth-error hidden"></div>

            ${
              this.isRegisterMode
                ? `
              <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" placeholder="John Doe" required autocomplete="name" />
              </div>
            `
                : ""
            }

            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="user@example.com" required autocomplete="email" />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="••••••••" required minlength="8" autocomplete="${this.isRegisterMode ? "new-password" : "current-password"}" />
            </div>

            ${
              !this.isRegisterMode
                ? `
              <a href="/forgot-password" data-link class="auth-link">Forgot password?</a>
            `
                : ""
            }

            <button type="submit" id="submit-btn" class="btn btn-primary btn-block">
              ${this.isRegisterMode ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const tabLogin = this.querySelector("#tab-login");
    const tabRegister = this.querySelector("#tab-register");
    const form = this.querySelector("#auth-form");
    const errorBox = this.querySelector("#auth-error");

    tabLogin.addEventListener("click", () => {
      if (this.isRegisterMode) {
        this.isRegisterMode = false;
        this.render();
      }
    });

    tabRegister.addEventListener("click", () => {
      if (!this.isRegisterMode) {
        this.isRegisterMode = true;
        this.render();
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.classList.add("hidden");
      errorBox.textContent = "";

      const email = this.querySelector("#email").value.trim();
      const password = this.querySelector("#password").value;
      const name = this.isRegisterMode ? this.querySelector("#name").value.trim() : "";

      const submitBtn = this.querySelector("#submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      try {
        let res;
        if (this.isRegisterMode) {
          res = await API.register(name, email, password);
        } else {
          res = await API.login(email, password);
        }

        // Update reactive state; proxy automatically persists to localStorage
        store.jwt = res.token;
        store.user = res.user;

        // Route back to homepage
        router.go("/");
      } catch (err) {
        errorBox.textContent = err.message || "Authentication failed.";
        errorBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = this.isRegisterMode ? "Create Account" : "Sign In";
      }
    });
  }
}

customElements.define("login-page", LoginPage);