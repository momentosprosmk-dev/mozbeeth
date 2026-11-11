// gateway.js | Links centrales de acceso - Mozbeeth

(function () {
  window.enlaces = {
    "btn-whatsapp": "https://wa.me/573000000000?text=Hola%20Mozbeeth.%20Quiero%20cotizar%20una%20producci%C3%B3n%20o%20licenciar%20un%20beat.",
    "btn-spotify": "https://open.spotify.com/",
    "btn-instagram": "https://www.instagram.com/",
    "btn-tiktok": "https://www.tiktok.com/",
    "btn-youtube": "https://www.youtube.com/",
    "numero-local": "573000000000"
  };

  document.addEventListener("DOMContentLoaded", () => {
    Object.keys(window.enlaces).forEach((id) => {
      const valor = window.enlaces[id];
      const elemento = document.getElementById(id);
      if (!elemento || !valor) return;

      if (elemento.tagName === "A") {
        elemento.setAttribute("href", valor);
      } else {
        elemento.addEventListener("click", () => {
          window.location.href = valor;
        });
      }
    });
  });
})();
