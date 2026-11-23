// Mis postulaciones (vista del estudiante): estado en tiempo real con su historial (RF07)
// y contacto con la empresa por WhatsApp (RF08).
import { requerirRol, mensajeError } from "../auth.js";
import { escucharMisPostulaciones } from "../postulaciones.js";
import { pintarCabecera, mostrarMensaje, escapar, formatearFecha, enlaceWhatsApp } from "../ui.js";
import { ROLES } from "../datos.js";

pintarCabecera();

const { perfil } = await requerirRol([ROLES.ESTUDIANTE]);

const mensaje = document.getElementById("mensaje");
const subtitulo = document.getElementById("subtitulo");
const lista = document.getElementById("lista-postulaciones");

escucharMisPostulaciones(perfil.uid, pintar, (error) => {
  subtitulo.textContent = "";
  mostrarMensaje(mensaje, mensajeError(error), "error");
});

function pintar(postulaciones) {
  const n = postulaciones.length;
  subtitulo.textContent = n
    ? `${n} ${n === 1 ? "postulación" : "postulaciones"} · se actualiza sola cuando la empresa cambia el estado`
    : "";
  lista.innerHTML = n
    ? postulaciones.map(fila).join("")
    : `<li class="vacio"><strong>Todavía no postulaste</strong>Busca una oferta en <a href="/index.html">Ofertas</a> y envía tu CV.</li>`;
}

function claseEstado(estado) {
  return `estado estado--${String(estado || "").toLowerCase()}`;
}

function fila(p) {
  const whatsapp = p.empresaWhatsapp
    ? `<a class="boton boton--whatsapp" target="_blank" rel="noopener"
         href="${enlaceWhatsApp(p.empresaWhatsapp, `Hola ${p.empresaNombre}, soy ${perfil.nombre}. Les escribo por mi postulación a "${p.ofertaTitulo}".`)}">WhatsApp</a>`
    : "";

  const historial = (p.historial || [])
    .map((h) => `<li><span class="${claseEstado(h.estado)}">${escapar(h.estado)}</span>${
      h.fecha ? ` <time>${formatearFecha(h.fecha)}</time>` : ""
    }</li>`)
    .join("");

  return `
    <li class="fila">
      <div>
        <p class="fila__empresa">${escapar(p.empresaNombre)}</p>
        <h2 class="fila__titulo"><a href="/oferta.html?id=${encodeURIComponent(p.ofertaId)}">${escapar(p.ofertaTitulo)}</a></h2>
        <p class="fila__meta">${p.fecha ? `Postulaste el ${formatearFecha(p.fecha)} · ` : ""}<span class="${claseEstado(p.estado)}">${escapar(p.estado)}</span></p>
      </div>
      <div class="acciones">${whatsapp}</div>
      ${historial ? `<ol class="historial" aria-label="Historial de estados">${historial}</ol>` : ""}
    </li>`;
}
