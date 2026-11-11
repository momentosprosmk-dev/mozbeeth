// servicios.js | Renderizado de Servicios y Planes de Licencias - Mozbeeth

document.addEventListener("DOMContentLoaded", () => {
  const servicesEl = document.getElementById("services-grid");
  const licensesEl = document.getElementById("licenses-grid");

  fetch("/recursos/json/servicios/servicios.json")
    .then((res) => res.json())
    .then((data) => {
      if (servicesEl && data.services) {
        servicesEl.innerHTML = data.services
          .map(
            (srv) => `
            <article class="service-card">
              <span class="service-badge">${srv.badge}</span>
              <h3><i class="fa-solid ${srv.icon}" style="color:var(--oro);margin-right:8px;"></i>${srv.title}</h3>
              <p style="color:var(--gris);font-size:0.92rem;margin:0;">${srv.description}</p>
              <ul class="feature-list">
                ${srv.features.map((f) => `<li><span>✓</span>${f}</li>`).join("")}
              </ul>
              <div style="font-weight:800;color:var(--oro);font-size:1.1rem;margin-top:8px;">${srv.startingPrice}</div>
              <a href="/formularios/cotizar/?servicio=${encodeURIComponent(srv.title)}" class="card-action-btn">Cotizar Servicio</a>
            </article>
          `
          )
          .join("");
      }

      if (licensesEl && data.licenses) {
        licensesEl.innerHTML = data.licenses
          .map(
            (lic) => `
            <div class="license-card ${lic.popular ? "popular" : ""}">
              ${lic.popular ? `<span class="service-badge" style="background:var(--oro);color:#000;">MÁS ELEGIDA</span>` : ""}
              <h3>${lic.name}</h3>
              <div class="license-price">${lic.price}</div>
              <p style="color:var(--gris);font-size:0.88rem;margin:0;">${lic.subtitle}</p>
              <ul class="feature-list">
                ${lic.perks.map((p) => `<li><span>✦</span>${p}</li>`).join("")}
              </ul>
              <a href="/catalogo/categorias/" class="card-action-btn">Elegir un Beat</a>
            </div>
          `
          )
          .join("");
      }
    })
    .catch((err) => console.error("Error cargando servicios.json:", err));
});
