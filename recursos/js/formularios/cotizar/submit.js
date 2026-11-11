// submit.js | Envío de cotización o compra de licencia a WhatsApp - Mozbeeth

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cotizarForm");
  if (!form) return;

  // Preseleccionar si viene ?beat= o ?servicio= en la URL
  const params = new URLSearchParams(window.location.search);
  const beatParam = params.get("beat");
  const servicioParam = params.get("servicio");

  const servicioSelect = document.getElementById("servicioSeleccionado");
  const mensajeInput = document.getElementById("detallesProyecto");

  if (beatParam && mensajeInput) {
    if (servicioSelect) servicioSelect.value = "Licencia de Beat / Instrumental";
    mensajeInput.value = `Me interesa adquirir licencia del beat "${beatParam}". `;
  } else if (servicioParam && servicioSelect) {
    for (const opt of servicioSelect.options) {
      if (opt.value.includes(servicioParam) || servicioParam.includes(opt.value)) {
        servicioSelect.value = opt.value;
        break;
      }
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value.trim();
    const servicio = servicioSelect ? servicioSelect.value : "";
    const presupuesto = document.getElementById("presupuesto").value;
    const fecha = document.getElementById("fecha").value;
    const detalles = mensajeInput ? mensajeInput.value.trim() : "";

    const numero = (window.enlaces && window.enlaces["numero-local"]) || "573000000000";
    const texto =
      `Hola Mozbeeth, soy *${nombre}*.\n` +
      `• *Servicio:* ${servicio}\n` +
      `• *Presupuesto:* ${presupuesto}\n` +
      `• *Fecha estimada:* ${fecha}\n` +
      `• *Detalles:* ${detalles}`;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener");
  });
});
