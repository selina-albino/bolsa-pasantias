// Detalle de oferta (RF05) y postulación con CV (RF06).
import { esperarUsuario, mensajeError } from "../auth.js";
import { obtenerOferta } from "../ofertas.js";
import { postular, obtenerMiPostulacion, validarCV } from "../postulaciones.js";
import {
  pintarCabecera,
  mostrarMensaje,
  escapar,
  datosPlazo,
  hoyISO,
  parametro,
  enlaceWhatsApp,
} from "../ui.js";
import { ROLES, ESTADO_OFERTA } from "../datos.js";

pintarCabecera();

const mensaje = document.getElementById("mensaje");
const tituloPostular = document.getElementById("titulo-postular");
const contenido = document.getElementById("contenido-postular");
const id = parametro("id");

const { perfil } = await esperarUsuario();
const oferta = id ? await obtenerOferta(id).catch(() => null) : null;

if (!oferta) {
  mostrarMensaje(mensaje, "Esta oferta no existe o ya no está disponible.", "error");
} else {
  pintarDetalle(oferta);
  await pintarPostulacion(oferta);
}

function pintarDetalle(o) {
  document.title = `${o.titulo} | CampusJob`;
  document.getElementById("empresa").textContent = o.empresaNombre;
  document.getElementById("titulo-oferta").textContent = o.titulo;
  document.getElementById("rasgos").innerHTML = `
    <li class="rasgo ${o.tipo === "Pasantía" ? "rasgo--pasantia" : ""}">${escapar(o.tipo)}</li>
    <li class="rasgo">${escapar(o.modalidad)}</li>`;
  document.getElementById("descripcion").textContent = o.descripcion;
  document.getElementById("requisitos").textContent = o.requisitos;
  document.getElementById("carreras").textContent = (o.carreras || []).join(", ");
  document.getElementById("ubicacion").textContent = o.ubicacion;
  document.getElementById("horario").textContent = o.horario;

  const plazo = datosPlazo(o.fechaLimite);
  const cerrada = o.estado !== ESTADO_OFERTA.ABIERTA || plazo.nota === "cerró";
  document.getElementById("plazo-dia").textContent = plazo.dia;
  document.getElementById("plazo-texto").innerHTML = cerrada
    ? `${plazo.mes}<br>postulaciones cerradas`
    : `${plazo.mes}<br>${plazo.nota}`;

  document.getElementById("detalle").hidden = false;
}

async function pintarPostulacion(o) {
  // Visitante sin sesión
  if (!perfil) {
    const volver = encodeURIComponent(location.pathname + location.search);
    contenido.innerHTML = `
      <p>Para postular necesitas una cuenta de estudiante. Es gratis.</p>
      <div class="formulario">
        <a class="boton boton--bloque" href="/registro.html">Crear cuenta</a>
        <a class="boton boton--secundario boton--bloque" href="/login.html?volver=${volver}">Ya tengo cuenta</a>
      </div>`;
    return;
  }

  // La empresa dueña ve un acceso para editar
  if (perfil.rol === ROLES.EMPRESA && perfil.uid === o.empresaId) {
    tituloPostular.textContent = "Es tu oferta";
    contenido.innerHTML = `<a class="boton boton--secundario boton--bloque" href="/empresa/oferta.html?id=${o.id}">Editar oferta</a>`;
    return;
  }

  if (perfil.rol !== ROLES.ESTUDIANTE) {
    tituloPostular.textContent = "Solo para estudiantes";
    contenido.innerHTML = `<p>Las postulaciones se hacen con una cuenta de estudiante.</p>`;
    return;
  }

  // ¿Ya postuló?
  const previa = await obtenerMiPostulacion(o.id, perfil.uid).catch(() => null);
  if (previa) {
    pintarYaPostulado(o, previa);
    return;
  }

  // ¿Sigue abierta y dentro del plazo?
  const vencida = o.fechaLimite && o.fechaLimite < hoyISO();
  if (o.estado !== ESTADO_OFERTA.ABIERTA || vencida) {
    contenido.innerHTML = `<p>Esta oferta ya no recibe postulaciones.</p>
      <a class="boton boton--secundario boton--bloque" href="/index.html">Ver otras ofertas</a>`;
    return;
  }

  contenido.innerHTML = `
    <form id="form-postular" class="formulario" novalidate>
      <label class="archivo">
        <input type="file" id="cv" name="cv" accept="application/pdf,.pdf" required>
        <span id="nombre-archivo" class="archivo__nombre">Elegir mi CV</span>
        <small>PDF de hasta 700 KB</small>
      </label>
      <p id="mensaje-postular" role="alert" hidden></p>
      <button type="submit" class="boton boton--bloque">Enviar postulación</button>
    </form>`;

  const form = document.getElementById("form-postular");
  const mensajePostular = document.getElementById("mensaje-postular");
  const nombreArchivo = document.getElementById("nombre-archivo");

  form.cv.addEventListener("change", () => {
    const archivo = form.cv.files[0];
    nombreArchivo.textContent = archivo ? archivo.name : "Elegir mi CV";
    const error = archivo ? validarCV(archivo) : null;
    mostrarMensaje(mensajePostular, error || "", "error");
  });

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
      boton.textContent = "Enviar postulación";
    }
  });
}

function pintarYaPostulado(o, postulacion, recien = false) {
  tituloPostular.textContent = recien ? "Postulación enviada" : "Ya postulaste";
  const contacto = o.empresaWhatsapp
    ? `<a class="boton boton--whatsapp boton--bloque" target="_blank" rel="noopener"
         href="${enlaceWhatsApp(o.empresaWhatsapp, `Hola, soy ${perfil.nombre}. Postulé a la oferta "${o.titulo}".`)}">
         Escribir a la empresa por WhatsApp</a>`
    : "";

  contenido.innerHTML = `
    <p>Estado de tu postulación: <strong>${escapar(postulacion?.estado || "Enviada")}</strong>.
       Cambiará en "Mis postulaciones" cuando la empresa revise tu CV.</p>
    <div class="formulario">
      <a class="boton boton--secundario boton--bloque" href="/estudiante/postulaciones.html">Ver mis postulaciones</a>
      ${contacto}
    </div>`;
}
