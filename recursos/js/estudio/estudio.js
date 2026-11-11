// estudio.js | Renderizado de Equipos y Estudio - Mozbeeth

document.addEventListener("DOMContentLoaded", () => {
  const gearEl = document.getElementById("gear-grid");
  if (!gearEl) return;

  fetch("/recursos/json/estudio/equipos.json")
    .then((res) => res.json())
    .then((items) => {
      gearEl.innerHTML = items
        .map(
          (g) => `
          <div class="gear-item">
            <span class="gear-category">${g.category}</span>
            <p class="gear-detail">${g.items}</p>
            <p class="gear-desc">${g.description}</p>
          </div>
        `
        )
        .join("");
    })
    .catch((err) => console.error("Error cargando equipos.json:", err));
});
