import { API } from "../services/api.js";
import { router } from "../services/router.js";

class ResetPasswordPage extends HTMLElement {
  connectedCallback() {
    this.token = new URLSearchParams(window.location.search).get("token") || "";
    this.render();
  }

  render() {
    this.innerHTML = `
      <section class="auth-container">
        <div class="auth-card">
          <div class="auth-tabs">
            <span class="tab-btn active">Set New Password</span>
          </div>

          <form id="reset-form" class="auth-form">
            <div id="reset-error" class="auth-error hidden"></div>
            <div id="reset-success" class="auth-success hidden"></div>

            ${
              !this.token
                ? ""
                : `
            <div class="form-group">
              <label for="password">New Password</label>
              <input type="password" id="password" name="password" placeholder="••••••••" required minlength="8" autocomplete="new-password" />
            </div>

            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input type="password" id="confirm-password" name="confirm-password" placeholder="••••••••" required minlength="8" autocomplete="new-password" />
            </div>

            <button type="submit" id="submit-btn" class="btn btn-primary btn-block">Reset Password</button>
            `
            }

            <a href="/login" data-link class="auth-link">Back to Sign In</a>
          </form>
        </div>
      </section>
    `;

    if (!this.token) {
      const errorBox = this.querySelector("#reset-error");
      errorBox.textContent = "This reset link is missing or invalid. Please request a new one.";
      errorBox.classList.remove("hidden");
      return;
    }

    this.bindEvents();
  }

  bindEvents() {
    const form = this.querySelector("#reset-form");
    const errorBox = this.querySelector("#reset-error");
    const successBox = this.querySelector("#reset-success");
    const submitBtn = this.querySelector("#submit-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.classList.add("hidden");
      errorBox.textContent = "";
      successBox.classList.add("hidden");
      successBox.textContent = "";

      const password = this.querySelector("#password").value;
      const confirmPassword = this.querySelector("#confirm-password").value;

      if (password !== confirmPassword) {
        errorBox.textContent = "Passwords do not match.";
        errorBox.classList.remove("hidden");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting...";

      try {
        const res = await API.resetPassword(this.token, password);
        successBox.textContent = res.message || "Password has been reset successfully.";
        successBox.classList.remove("hidden");
        setTimeout(() => router.go("/login"), 1500);
      } catch (err) {
        errorBox.textContent = err.message || "Unable to reset password.";
        errorBox.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Reset Password";
      }
    });
  }
}

customElements.define("reset-password-page", ResetPasswordPage);
