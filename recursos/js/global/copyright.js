// copyright.js | Footer PC & Copyright - Mozbeeth

function initFooter() {
  const htmlText =
    '© 2026 · MOZBEETH Music Producer <br> Powered by ' +
    '<a href="https://momentospro.com/" target="_blank" style="color:inherit; text-decoration:underline;">Momentos Pro</a>';

  const footerMenu = document.getElementById("texto-footer");
  if (footerMenu) footerMenu.innerHTML = htmlText;

  const footerPc = document.getElementById("texto-footer-pc");
  if (footerPc) footerPc.innerHTML = htmlText;
}

function initFooterSocial() {
  document.querySelectorAll(".footer-social a").forEach((el) => {
    const key = el.getAttribute("data-link");
    if (window.enlaces && window.enlaces[key]) {
      el.href = window.enlaces[key];
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const footerPcContainer = document.getElementById("footer-pc");
  if (!footerPcContainer) {
    initFooter();
    return;
  }

  fetch("/recursos/html/global/footer_pc.html")
    .then((response) => response.text())
    .then((data) => {
      footerPcContainer.innerHTML = data;
      initFooter();
      initFooterSocial();
    })
    .catch((err) => console.error("Error cargando footer-pc:", err));
});
