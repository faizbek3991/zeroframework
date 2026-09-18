const initialState = {
  jwt: localStorage.getItem("jwt") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),
  movies: []
};

const store = new Proxy(initialState, {
  set(target, property, value) {
    target[property] = value;

    if (property === "jwt") {
      if (value) {
        localStorage.setItem("jwt", value);
      } else {
        localStorage.removeItem("jwt");
      }
    }

    if (property === "user") {
      if (value) {
        localStorage.setItem("user", JSON.stringify(value));
      } else {
        localStorage.removeItem("user");
      }
    }

    window.dispatchEvent(
      new CustomEvent("storechange", { detail: { property, value } })
    );
    return true;
  }
});

export default store;