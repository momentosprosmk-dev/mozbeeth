// creditos.js | Renderizado de Créditos y Discografía - Mozbeeth

document.addEventListener("DOMContentLoaded", () => {
  const creditsEl = document.getElementById("credits-grid");
  if (!creditsEl) return;

  fetch("/recursos/json/creditos/creditos.json")
    .then((res) => res.json())
    .then((items) => {
      creditsEl.innerHTML = items
        .map(
          (cr) => `
          <div class="credit-card">
            <div class="vinyl-art">
              <div class="vinyl-disc">
                <div class="vinyl-label" style="background:${cr.accent}"></div>
              </div>
              <span class="credit-streams">${cr.streams}</span>
            </div>
            <div class="credit-body">
              <span class="credit-year">${cr.year} • ${cr.role}</span>
              <h4 class="credit-title">${cr.title}</h4>
              <p class="credit-artist">${cr.artist}</p>
            </div>
          </div>
        `
        )
        .join("");
    })
    .catch((err) => console.error("Error cargando creditos.json:", err));
});
