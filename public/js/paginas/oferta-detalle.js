// Detalle de oferta (RF05) y postulación con CV (RF06).
import { esperarUsuario, mensajeError } from "../auth.js";
import { obtenerOferta } from "../ofertas.js";
import { postular, obtenerMiPostulacion, validarCV } from "../postulaciones.js";
import {
  pintarCabecera,
  mostrarMensaje,
  escapar,
  formatearFecha,
  hoyISO,
  parametro,
  enlaceWhatsApp,
} from "../ui.js";
import { ROLES, ESTADO_OFERTA } from "../datos.js";

pintarCabecera();

const mensaje = document.getElementById("mensaje");
const seccionPostular = document.getElementById("postular");
const contenidoPostular = document.getElementById("contenido-postular");
const id = parametro("id");

const { perfil } = await esperarUsuario();
const oferta = id ? await obtenerOferta(id).catch(() => null) : null;

if (!oferta) {
  mostrarMensaje(mensaje, "La oferta no existe o ya no está disponible.", "error");
} else {
  pintarDetalle(oferta);
  await pintarPostulacion(oferta);
}

function pintarDetalle(o) {
  const abierta = o.estado === ESTADO_OFERTA.ABIERTA;
  document.title = `${o.titulo} | Bolsa de Pasantías`;
  const estado = document.getElementById("estado");
  estado.textContent = abierta ? "Abierta" : "Cerrada";
  estado.classList.add(`etiqueta--${o.estado}`);

  document.getElementById("titulo-oferta").textContent = o.titulo;
  document.getElementById("empresa").textContent = o.empresaNombre;
  document.getElementById("etiquetas").innerHTML = [o.tipo, o.modalidad]
    .map((t) => `<li class="etiqueta">${escapar(t)}</li>`)
    .join("");
  document.getElementById("descripcion").textContent = o.descripcion;
  document.getElementById("requisitos").textContent = o.requisitos;
  document.getElementById("carreras").textContent = (o.carreras || []).join(", ");
  document.getElementById("ubicacion").textContent = o.ubicacion;
  document.getElementById("horario").textContent = o.horario;
  document.getElementById("fecha-limite").textContent = formatearFecha(o.fechaLimite);
  document.getElementById("detalle").hidden = false;
}

async function pintarPostulacion(o) {
  // Visitante sin sesión
  if (!perfil) {
    seccionPostular.hidden = false;
    const volver = encodeURIComponent(location.pathname + location.search);
    contenidoPostular.innerHTML = `
      <p>Para postular necesitas una cuenta de estudiante.</p>
      <div class="acciones">
        <a class="boton" href="/login.html?volver=${volver}">Iniciar sesión</a>
        <a class="boton boton--secundario" href="/registro.html">Registrarse</a>
      </div>`;
    return;
  }

  // La empresa dueña ve un acceso a editar
  if (perfil.rol === ROLES.EMPRESA && perfil.uid === o.empresaId) {
    seccionPostular.hidden = false;
    document.getElementById("titulo-postular").textContent = "Tu oferta";
    contenidoPostular.innerHTML = `<a class="boton boton--secundario" href="/empresa/oferta.html?id=${o.id}">Editar oferta</a>`;
    return;
  }

  if (perfil.rol !== ROLES.ESTUDIANTE) return;
  seccionPostular.hidden = false;

  // ¿Ya postuló?
  const previa = await obtenerMiPostulacion(o.id, perfil.uid).catch(() => null);
  if (previa) {
    pintarYaPostulado(o, previa);
    return;
  }

  // ¿La oferta sigue abierta y dentro del plazo?
  const vencida = o.fechaLimite && o.fechaLimite < hoyISO();
  if (o.estado !== ESTADO_OFERTA.ABIERTA || vencida) {
    mostrarMensaje(contenidoPostular, "No es posible postular: la oferta está cerrada o venció su fecha límite.", "aviso");
    return;
  }

  contenidoPostular.innerHTML = `
    <form id="form-postular" class="formulario" novalidate>
      <div class="campo">
        <label for="cv">Tu CV (PDF, máximo 5 MB)</label>
        <input type="file" id="cv" name="cv" accept="application/pdf,.pdf" required>
      </div>
      <p id="mensaje-postular" role="alert" hidden></p>
      <div><button type="submit" class="boton">Postular</button></div>
    </form>`;

  const form = document.getElementById("form-postular");
  const mensajePostular = document.getElementById("mensaje-postular");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const archivo = form.cv.files[0];
    const error = validarCV(archivo);
    if (error) {
      mostrarMensaje(mensajePostular, error, "error");
      return;
    }

    const boton = form.querySelector("button");
    boton.disabled = true;
    boton.textContent = "Enviando...";
    mostrarMensaje(mensajePostular, "");

    try {
      await postular(o, perfil, archivo);
      const nueva = await obtenerMiPostulacion(o.id, perfil.uid);
      pintarYaPostulado(o, nueva, true);
    } catch (err) {
      mostrarMensaje(mensajePostular, mensajeError(err), "error");
      boton.disabled = false;
      boton.textContent = "Postular";
    }
  });
}

function pintarYaPostulado(o, postulacion, recien = false) {
  const contacto = o.empresaWhatsapp
    ? `<a class="boton boton--whatsapp" target="_blank" rel="noopener"
         href="${enlaceWhatsApp(o.empresaWhatsapp, `Hola, soy ${perfil.nombre}. Postulé a la oferta "${o.titulo}".`)}">
         Contactar por WhatsApp</a>`
    : "";

  contenidoPostular.innerHTML = `
    <p class="mensaje mensaje--${recien ? "exito" : "info"}">
      ${recien ? "¡Postulación enviada!" : "Ya postulaste a esta oferta."}
      Estado actual: <strong>${escapar(postulacion?.estado || "Enviada")}</strong>
    </p>
    <div class="acciones" style="margin-top: 1rem">
      <a class="boton boton--secundario" href="/estudiante/postulaciones.html">Ver mis postulaciones</a>
      ${contacto}
    </div>`;
}
