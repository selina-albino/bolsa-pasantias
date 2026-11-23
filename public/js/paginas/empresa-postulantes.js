// Postulantes de una oferta (vista de la empresa): ver CV (RF06), cambiar estado (RF07)
// y contactar al estudiante por WhatsApp (RF08).
import { requerirRol, mensajeError } from "../auth.js";
import { obtenerOferta } from "../ofertas.js";
import { listarPostulantes, cambiarEstadoPostulacion, abrirCV } from "../postulaciones.js";
import { pintarCabecera, mostrarMensaje, escapar, formatearFecha, parametro, enlaceWhatsApp } from "../ui.js";
import { ROLES, ESTADOS_POSTULACION } from "../datos.js";

pintarCabecera();

const { perfil } = await requerirRol([ROLES.EMPRESA]);

const mensaje = document.getElementById("mensaje");
const subtitulo = document.getElementById("subtitulo");
const lista = document.getElementById("lista-postulantes");
const id = parametro("id");

const oferta = id ? await obtenerOferta(id).catch(() => null) : null;
let postulantes = [];

if (!oferta || oferta.empresaId !== perfil.uid) {
  mostrarMensaje(mensaje, "No encontramos esta oferta entre las tuyas.", "error");
} else {
  document.title = `Postulantes: ${oferta.titulo} | CampusJob`;
  cargar();
}

async function cargar() {
  try {
    postulantes = await listarPostulantes(oferta.id, perfil.uid);
    const n = postulantes.length;
    pintarSubtitulo();
    lista.innerHTML = n
      ? postulantes.map(fila).join("")
      : `<li class="vacio"><strong>Todavía no hay postulantes</strong>Cuando un estudiante postule, aparecerá aquí con su CV.</li>`;
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
}

function pintarSubtitulo() {
  const n = postulantes.length;
  const sinRevisar = postulantes.filter((p) => p.estado === "Enviada").length;
  subtitulo.textContent = `${oferta.titulo} · ${n} ${n === 1 ? "postulante" : "postulantes"}` +
    (sinRevisar ? ` · ${sinRevisar} ${sinRevisar === 1 ? "nueva" : "nuevas"}` : "");
}

// Al revisar una postulación deja de ser "nueva": se quita la etiqueta.
function marcarRevisada(postId) {
  document.querySelector(`[data-etiqueta="${postId}"]`)?.remove();
  document.getElementById(`fila-${postId}`)?.classList.remove("fila--nueva");
  pintarSubtitulo();
}

function fila(p) {
  const opciones = ESTADOS_POSTULACION.map(
    (e) => `<option value="${e}" ${e === p.estado ? "selected" : ""}>${e}</option>`
  ).join("");

  const whatsapp = p.estudianteWhatsapp
    ? `<a class="boton boton--whatsapp" target="_blank" rel="noopener"
         href="${enlaceWhatsApp(p.estudianteWhatsapp, `Hola ${p.estudianteNombre}, te escribimos de ${perfil.nombre} por tu postulación a "${oferta.titulo}".`)}">WhatsApp</a>`
    : "";

  const datos = [p.estudianteCarrera, p.estudianteSemestre ? `${p.estudianteSemestre}° semestre` : ""]
    .filter(Boolean)
    .join(", ");

  return `
    <li class="fila ${p.estado === "Enviada" ? "fila--nueva" : ""}" id="fila-${p.id}">
      <div>
        <h2 class="fila__titulo">${escapar(p.estudianteNombre)}${
          p.estado === "Enviada" ? ` <span class="etiqueta-nueva" data-etiqueta="${p.id}">Nueva</span>` : ""
        }</h2>
        <p class="fila__meta">${escapar(datos)}${p.fecha ? ` · Postuló el ${formatearFecha(p.fecha)}` : ""}</p>
      </div>
      <div class="acciones">
        <label class="sr-only" for="estado-${p.id}">Estado de ${escapar(p.estudianteNombre)}</label>
        <select id="estado-${p.id}" class="selector-estado" data-estado="${p.id}">${opciones}</select>
        <button type="button" class="boton boton--secundario" data-cv="${p.id}">Ver CV</button>
        ${whatsapp}
      </div>
    </li>`;
}

// Ver CV: si la postulación estaba "Enviada", pasa a "Vista".
lista.addEventListener("click", async (evento) => {
  const postId = evento.target.dataset.cv;
  if (!postId) return;
  try {
    await abrirCV(postId);
    const p = postulantes.find((x) => x.id === postId);
    if (p?.estado === "Enviada") {
      await cambiarEstadoPostulacion(postId, "Vista");
      p.estado = "Vista";
      document.getElementById(`estado-${postId}`).value = "Vista";
      marcarRevisada(postId);
    }
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});

// RF07: cambiar el estado desde la lista.
lista.addEventListener("change", async (evento) => {
  const postId = evento.target.dataset.estado;
  if (!postId) return;
  const p = postulantes.find((x) => x.id === postId);
  const nuevo = evento.target.value;
  try {
    await cambiarEstadoPostulacion(postId, nuevo);
    if (p) p.estado = nuevo;
    if (nuevo !== "Enviada") marcarRevisada(postId);
    mostrarMensaje(mensaje, `Estado de ${p?.estudianteNombre || "la postulación"} cambiado a "${nuevo}".`, "exito");
  } catch (error) {
    evento.target.value = p?.estado || "Enviada";
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});
