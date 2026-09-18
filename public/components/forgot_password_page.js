import { API } from "../services/api.js";

class ForgotPasswordPage extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <section class="auth-container">
        <div class="auth-card">
          <div class="auth-tabs">
            <span class="tab-btn active">Reset Password</span>
          </div>

          <form id="forgot-form" class="auth-form">
            <div id="forgot-error" class="auth-error hidden"></div>
            <div id="forgot-success" class="auth-success hidden"></div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="user@example.com" required autocomplete="email" />
            </div>

            <button type="submit" id="submit-btn" class="btn btn-primary btn-block">Send Reset Link</button>

            <a href="/login" data-link class="auth-link">Back to Sign In</a>
          </form>
        </div>
      </section>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const form = this.querySelector("#forgot-form");
    const errorBox = this.querySelector("#forgot-error");
    const successBox = this.querySelector("#forgot-success");
    const submitBtn = this.querySelector("#submit-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.classList.add("hidden");
      errorBox.textContent = "";
      successBox.classList.add("hidden");
      successBox.textContent = "";

      const email = this.querySelector("#email").value.trim();

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        const res = await API.forgotPassword(email);
        successBox.textContent = res.message || "If an account exists for that email, a reset link has been sent.";
        successBox.classList.remove("hidden");
        form.reset();
      } catch (err) {
        errorBox.textContent = err.message || "Something went wrong. Please try again.";
        errorBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Reset Link";
      }
    });
  }
}

customElements.define("forgot-password-page", ForgotPasswordPage);
