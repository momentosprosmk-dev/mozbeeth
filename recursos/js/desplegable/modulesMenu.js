// modulesMenu.js | Enlaces dinámicos en el menú

function initModulesNavigation() {
  if (window.enlaces && typeof window.enlaces === "object") {
    Object.keys(window.enlaces).forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        if (btn.tagName === "A") {
          btn.href = window.enlaces[btnId];
        } else {
          btn.addEventListener("click", () => {
            window.location.href = window.enlaces[btnId];
          });
        }
      }
    });
  }
}
initModulesNavigation();
