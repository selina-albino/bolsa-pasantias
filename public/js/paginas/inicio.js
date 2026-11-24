// Portada: listado de ofertas abiertas con el buscador en forma de frase (RF04).
import { listarOfertasAbiertas } from "../ofertas.js";
import { mensajeError } from "../auth.js";
import { pintarCabecera, mostrarMensaje, escapar, datosPlazo, hoyISO } from "../ui.js";
import { CARRERAS, AREAS } from "../datos.js";

pintarCabecera();

const form = document.getElementById("buscador");
const lista = document.getElementById("lista-ofertas");
const resumen = document.getElementById("resumen");
const mensaje = document.getElementById("mensaje");
const contAreas = document.getElementById("areas");
const cifras = document.getElementById("cifras");

// Íconos simples por área (trazos SVG).
const ICONOS = {
  tecnologia: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  diseno: '<path d="M12 20l7-7-4-4-7 7-1 5z"/><path d="M15 9l3-3 3 3-3 3"/>',
  negocios: '<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/><path d="M14 8h4v4"/>',
  finanzas: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  construccion: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M10 21v-6h4v6"/>',
  industria: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  legal: '<path d="M12 4v16M7 20h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  personas: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
};

let areaElegida = "";

form.carrera.insertAdjacentHTML("beforeend", CARRERAS.map((c) => `<option>${escapar(c)}</option>`).join(""));

let ofertas = [];

// El área de una oferta es la de su primera carrera.
const areaDe = (o) => {
  for (const c of o.carreras || []) {
    const area = AREAS.find((a) => a.carreras.includes(c));
    if (area) return area;
  }
  return null;
};

export function fichaOferta(o) {
  const plazo = datosPlazo(o.fechaLimite);
  const carreras = (o.carreras || []).join(", ");
  const area = areaDe(o);
  return `
    <li class="ficha">
      <div class="ficha__cuerpo">
        <p class="ficha__empresa">${escapar(o.empresaNombre)}</p>
        <h2 class="ficha__titulo"><a href="/oferta.html?id=${o.id}">${escapar(o.titulo)}</a></h2>
        <ul class="rasgos" aria-label="Características">
          <li class="rasgo ${o.tipo === "Pasantía" ? "rasgo--pasantia" : ""}">${escapar(o.tipo)}</li>
          <li class="rasgo">${escapar(o.modalidad)}</li>
          ${area ? `<li class="rasgo rasgo--area">${escapar(area.nombre)}</li>` : ""}
        </ul>
        ${o.ubicacion ? `<p class="ficha__lugar">${escapar(o.ubicacion)}</p>` : ""}
        ${carreras ? `<p class="ficha__carreras">Para: ${escapar(carreras)}</p>` : ""}
      </div>
      <div class="talon ${plazo.pronto ? "talon--pronto" : ""}" aria-label="Fecha límite: ${plazo.dia} de ${plazo.mes}, ${plazo.nota}">
        <span class="talon__dia" aria-hidden="true">${plazo.dia}</span>
        <span class="talon__mes" aria-hidden="true">${plazo.mes}</span>
        <span class="talon__nota" aria-hidden="true">${plazo.nota}</span>
      </div>
    </li>`;
}

// Ofertas vigentes (abiertas y con fecha de cierre de hoy en adelante).
const vigentes = () => {
  const hoy = hoyISO();
  return ofertas.filter((o) => !o.fechaLimite || o.fechaLimite >= hoy);
};

// Cifras de la portada: ofertas abiertas, empresas y cuántas cierran esta semana.
function pintarCifras() {
  const lista = vigentes();
  const empresas = new Set(lista.map((o) => o.empresaId)).size;
  const pronto = lista.filter((o) => datosPlazo(o.fechaLimite).pronto).length;
  cifras.innerHTML = [
    [lista.length, lista.length === 1 ? "oferta abierta" : "ofertas abiertas"],
    [empresas, empresas === 1 ? "empresa publicando" : "empresas publicando"],
    [pronto, "cierran en 3 días o menos"],
  ].map(([n, texto]) => `<li><strong>${n}</strong> ${texto}</li>`).join("");
}

// Botones de área con el número de ofertas de cada una.
function pintarAreas() {
  const lista = vigentes();
  const boton = (id, nombre, n, icono) => `
    <button type="button" class="area" data-area="${id}" aria-pressed="${areaElegida === id}">
      ${icono ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icono}</svg>` : ""}
      <span class="area__nombre">${nombre}</span>
      <span class="area__cuenta">${n} ${n === 1 ? "oferta" : "ofertas"}</span>
    </button>`;
  contAreas.innerHTML =
    boton("", "Todas las áreas", lista.length, '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>') +
    AREAS.map((a) => boton(a.id, a.nombre, lista.filter((o) => areaDe(o)?.id === a.id).length, ICONOS[a.id])).join("");
}

contAreas.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-area]");
  if (!boton) return;
  areaElegida = boton.dataset.area === areaElegida ? "" : boton.dataset.area;
  contAreas.querySelectorAll("[data-area]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.area === areaElegida))
  );
  filtrar();
});

function filtrar() {
  const { carrera, tipo, modalidad } = Object.fromEntries(new FormData(form));
  const orden = document.getElementById("f-orden").value;
  const texto = form.texto.value.trim().toLowerCase();

  const resultado = vigentes().filter(
    (o) =>
      (!areaElegida || areaDe(o)?.id === areaElegida) &&
      (!carrera || (o.carreras || []).includes(carrera)) &&
      (!tipo || o.tipo === tipo) &&
      (!modalidad || o.modalidad === modalidad) &&
      (!texto || `${o.titulo} ${o.empresaNombre}`.toLowerCase().includes(texto))
  );

  if (orden === "cierre") {
    resultado.sort((a, b) => (a.fechaLimite || "9999").localeCompare(b.fechaLimite || "9999"));
  }

  const hayFiltros = carrera || tipo || modalidad || texto || areaElegida;
  const n = resultado.length;
  resumen.innerHTML =
    `<strong>${n} ${n === 1 ? "oferta abierta" : "ofertas abiertas"}</strong>` +
    (hayFiltros ? ` con estos filtros. <button type="button" class="boton-limpiar" id="limpiar">Quitar filtros</button>` : "");

  lista.innerHTML = n
    ? resultado.map(fichaOferta).join("")
    : `<li class="vacio"><strong>No hay ofertas con esta búsqueda</strong>Prueba con otra carrera o modalidad, o quita los filtros.</li>`;
}

form.addEventListener("input", filtrar);
document.getElementById("f-orden").addEventListener("change", filtrar);
form.addEventListener("submit", (e) => e.preventDefault());
resumen.addEventListener("click", (e) => {
  if (e.target.id !== "limpiar") return;
  form.reset();
  areaElegida = "";
  pintarAreas();
  filtrar();
  form.carrera.focus();
});

try {
  ofertas = await listarOfertasAbiertas();
  pintarCifras();
  pintarAreas();
  filtrar();
} catch (error) {
  resumen.textContent = "";
  mostrarMensaje(mensaje, mensajeError(error), "error");
}
