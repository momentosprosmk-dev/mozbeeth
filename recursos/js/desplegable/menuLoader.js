// menuLoader.js | Cargador del menú desplegable móvil

document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("menu-container");
  if (!menuContainer) return;

  fetch("/recursos/html/desplegable/menu.html")
    .then((res) => res.text())
    .then((html) => {
      menuContainer.innerHTML = html;

      const linkMenu = document.createElement("link");
      linkMenu.rel = "stylesheet";
      linkMenu.href = "/recursos/css/desplegable/menu.css";
      document.head.appendChild(linkMenu);

      const scriptMenu = document.createElement("script");
      scriptMenu.src = "/recursos/js/desplegable/menu.js";
      document.body.appendChild(scriptMenu);
      scriptMenu.onload = () => {
        if (typeof initMenu === "function") initMenu();
        if (typeof initFooter === "function") initFooter();
        if (typeof initModulesNavigation === "function") initModulesNavigation();
      };
    })
    .catch((err) => console.error("Error cargando el menú:", err));
});
