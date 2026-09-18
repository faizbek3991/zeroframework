class MovieItem extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title") || "Untitled";
    const year = this.getAttribute("year") || "N/A";
    const rating = this.getAttribute("rating") || "N/A";
    const description = this.getAttribute("description") || "No description provided.";
    const poster = this.getAttribute("poster") || "https://placehold.co/300x450?text=No+Poster";

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