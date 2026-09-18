import routes from "./routes.js";

export const router = {
  init() {
    // Intercept clicks on links with data-link attribute
    document.addEventListener("click", (e) => {
      const target = e.target.closest("a[data-link]");
      if (target) {
        e.preventDefault();
        this.go(target.getAttribute("href"));
      }
    });

    // Listen to browser forward/backward buttons
    window.addEventListener("popstate", () => {
      this.renderView(window.location.pathname, false);
    });

    this.renderView(window.location.pathname, false);
  },

  go(path, addToHistory = true) {
    if (addToHistory) {
      history.pushState(null, "", path);
    }
    this.renderView(path);
  },

  renderView(path) {
    const route = routes.find((r) => r.path === path) || routes.find((r) => r.path === "/");
    const appContainer = document.getElementById("app");

    const updateDOM = () => {
      appContainer.innerHTML = "";
      const element = document.createElement(route.component);
      appContainer.appendChild(element);
    };

    // Use native View Transitions API if supported by the browser
    if (document.startViewTransition) {
      document.startViewTransition(() => updateDOM());
    } else {
      updateDOM();
    }
  }
};