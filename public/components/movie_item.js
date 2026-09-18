function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class MovieItem extends HTMLElement {
  connectedCallback() {
    const title = escapeHtml(this.getAttribute("title") || "Untitled");
    const year = escapeHtml(this.getAttribute("year") || "N/A");
    const rating = escapeHtml(this.getAttribute("rating") || "N/A");
    const description = escapeHtml(this.getAttribute("description") || "No description provided.");
    const rawPoster = this.getAttribute("poster") || "";
    const poster = /^https?:\/\//i.test(rawPoster)
      ? escapeHtml(rawPoster)
      : "https://placehold.co/300x450?text=No+Poster";

    this.innerHTML = `
      <article class="movie-card">
        <img src="${poster}" alt="${title}" loading="lazy" class="movie-poster" />
        <div class="movie-content">
          <div class="movie-header">
            <h3>${title}</h3>
            <span class="movie-year">${year}</span>
          </div>
          <p class="movie-desc">${description}</p>
          <div class="movie-footer">
            <span class="movie-rating">★ ${rating}</span>
          </div>
        </div>
      </article>
    `;
  }
}

customElements.define("movie-item", MovieItem);
