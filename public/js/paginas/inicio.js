// Portada: listado de ofertas abiertas con el buscador en forma de frase (RF04).
import { listarOfertasAbiertas } from "../ofertas.js";
import { mensajeError } from "../auth.js";
import { pintarCabecera, mostrarMensaje, escapar, datosPlazo, hoyISO } from "../ui.js";
import { CARRERAS } from "../datos.js";

pintarCabecera();

const form = document.getElementById("buscador");
const lista = document.getElementById("lista-ofertas");
const resumen = document.getElementById("resumen");
const mensaje = document.getElementById("mensaje");

form.carrera.insertAdjacentHTML("beforeend", CARRERAS.map((c) => `<option>${escapar(c)}</option>`).join(""));

let ofertas = [];

export function fichaOferta(o) {
  const plazo = datosPlazo(o.fechaLimite);
  const carreras = (o.carreras || []).join(", ");
  return `
    <li class="ficha">
      <div class="ficha__cuerpo">
        <p class="ficha__empresa">${escapar(o.empresaNombre)}</p>
        <h2 class="ficha__titulo"><a href="/oferta.html?id=${o.id}">${escapar(o.titulo)}</a></h2>
        <ul class="rasgos" aria-label="Características">
          <li class="rasgo ${o.tipo === "Pasantía" ? "rasgo--pasantia" : ""}">${escapar(o.tipo)}</li>
          <li class="rasgo">${escapar(o.modalidad)}</li>
        </ul>
        ${carreras ? `<p class="ficha__carreras">Para: ${escapar(carreras)}</p>` : ""}
      </div>
      <div class="talon ${plazo.pronto ? "talon--pronto" : ""}" aria-label="Fecha límite: ${plazo.dia} de ${plazo.mes}, ${plazo.nota}">
        <span class="talon__dia" aria-hidden="true">${plazo.dia}</span>
        <span class="talon__mes" aria-hidden="true">${plazo.mes}</span>
        <span class="talon__nota" aria-hidden="true">${plazo.nota}</span>
      </div>
    </li>`;
}

function filtrar() {
  const { carrera, tipo, modalidad } = Object.fromEntries(new FormData(form));
  const texto = form.texto.value.trim().toLowerCase();
  const hoy = hoyISO();

  const resultado = ofertas.filter(
    (o) =>
      (!o.fechaLimite || o.fechaLimite >= hoy) &&
      (!carrera || (o.carreras || []).includes(carrera)) &&
      (!tipo || o.tipo === tipo) &&
      (!modalidad || o.modalidad === modalidad) &&
      (!texto || `${o.titulo} ${o.empresaNombre}`.toLowerCase().includes(texto))
  );

  const hayFiltros = carrera || tipo || modalidad || texto;
  const n = resultado.length;
  resumen.innerHTML =
    `<strong>${n} ${n === 1 ? "oferta abierta" : "ofertas abiertas"}</strong>` +
    (hayFiltros ? ` con estos filtros. <button type="button" class="boton-limpiar" id="limpiar">Quitar filtros</button>` : "");

  lista.innerHTML = n
    ? resultado.map(fichaOferta).join("")
    : `<li class="vacio"><strong>No hay ofertas con esta búsqueda</strong>Prueba con otra carrera o modalidad, o quita los filtros.</li>`;
}

form.addEventListener("input", filtrar);
form.addEventListener("submit", (e) => e.preventDefault());
resumen.addEventListener("click", (e) => {
  if (e.target.id !== "limpiar") return;
  form.reset();
  filtrar();
  form.carrera.focus();
});

try {
  ofertas = await listarOfertasAbiertas();
  filtrar();
} catch (error) {
  resumen.textContent = "";
  mostrarMensaje(mensaje, mensajeError(error), "error");
}
