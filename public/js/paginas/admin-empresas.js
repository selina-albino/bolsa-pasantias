// Validar empresas (vista del administrador, RF09): aprobar o rechazar con motivo.
import { requerirRol, mensajeError } from "../auth.js";
import { escucharEmpresas, aprobarEmpresa, rechazarEmpresa } from "../admin.js";
import { pintarCabecera, mostrarMensaje, escapar, formatearFecha, enlaceWhatsApp } from "../ui.js";
import { ROLES, VALIDACION } from "../datos.js";

pintarCabecera();

await requerirRol([ROLES.ADMIN]);

const mensaje = document.getElementById("mensaje");
const subtitulo = document.getElementById("subtitulo");
const filtros = document.getElementById("filtros");
const lista = document.getElementById("lista-empresas");

const FILTROS = [
  { valor: VALIDACION.PENDIENTE, texto: "Pendientes" },
  { valor: VALIDACION.APROBADA, texto: "Aprobadas" },
  { valor: VALIDACION.RECHAZADA, texto: "Rechazadas" },
  { valor: "todas", texto: "Todas" },
];

const ETIQUETAS = {
  [VALIDACION.PENDIENTE]: "Pendiente",
  [VALIDACION.APROBADA]: "Aprobada",
  [VALIDACION.RECHAZADA]: "Rechazada",
};

let empresas = [];
let filtro = VALIDACION.PENDIENTE;
// Formulario de rechazo abierto y lo que se lleva escrito: se conservan aunque
// la lista se vuelva a dibujar porque llegó un cambio en tiempo real.
let rechazandoId = null;
let borradorMotivo = "";

// Los filtros se dibujan una sola vez (así no se pierde el foco al cambiar de filtro);
// después solo se actualiza el número de cada uno.
filtros.innerHTML = FILTROS.map(
  (f) => `<label><input type="radio" name="filtro" value="${f.valor}" ${f.valor === filtro ? "checked" : ""}>
    ${f.texto}&nbsp;(<span id="cuenta-${f.valor}">0</span>)</label>`
).join("");

// Una empresa sin estadoValidacion se trata como pendiente.
const estadoDe = (e) => e.estadoValidacion || VALIDACION.PENDIENTE;

escucharEmpresas(
  (lista) => {
    empresas = lista;
    if (rechazandoId && !empresas.some((e) => e.uid === rechazandoId)) cerrarRechazo();
    pintar();
  },
  (error) => {
    subtitulo.textContent = "";
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
);

function pintar() {
  const cuenta = { todas: empresas.length };
  empresas.forEach((e) => (cuenta[estadoDe(e)] = (cuenta[estadoDe(e)] || 0) + 1));

  const pendientes = cuenta[VALIDACION.PENDIENTE] || 0;
  subtitulo.textContent = `${empresas.length} ${empresas.length === 1 ? "empresa registrada" : "empresas registradas"}` +
    (pendientes ? ` · ${pendientes} por revisar` : "");

  FILTROS.forEach((f) => {
    document.getElementById(`cuenta-${f.valor}`).textContent = cuenta[f.valor] || 0;
  });

  const visibles = filtro === "todas" ? empresas : empresas.filter((e) => estadoDe(e) === filtro);

  // Si el foco estaba en el motivo, se devuelve después de volver a dibujar.
  const conFoco = document.activeElement?.id === `motivo-${rechazandoId}`;

  lista.innerHTML = visibles.length
    ? visibles.map(fila).join("")
    : `<li class="vacio"><strong>${filtro === VALIDACION.PENDIENTE ? "No hay empresas por revisar" : "No hay empresas en esta lista"}</strong>Cuando una empresa se registre, aparecerá en Pendientes.</li>`;

  if (conFoco) document.getElementById(`motivo-${rechazandoId}`)?.focus();
}

function fila(e) {
  const estado = estadoDe(e);
  const contacto = [
    e.correo ? `<a href="mailto:${escapar(e.correo)}">${escapar(e.correo)}</a>` : "",
    e.whatsapp ? `<a href="${enlaceWhatsApp(e.whatsapp, `Hola ${e.nombre}, le escribimos de CampusJob por el registro de su empresa.`)}" target="_blank" rel="noopener">WhatsApp ${escapar(e.whatsapp)}</a>` : "",
  ].filter(Boolean).join(" · ");

  const botones = [
    estado !== VALIDACION.APROBADA
      ? `<button type="button" class="boton" data-aprobar="${e.uid}">Aprobar</button>` : "",
    estado !== VALIDACION.RECHAZADA && rechazandoId !== e.uid
      ? `<button type="button" class="boton boton--peligro" data-rechazar="${e.uid}">Rechazar</button>` : "",
  ].join("");

  const formulario = rechazandoId === e.uid
    ? `<form class="rechazo" data-formulario="${e.uid}" novalidate>
        <div class="campo">
          <label for="motivo-${e.uid}">Motivo del rechazo</label>
          <textarea id="motivo-${e.uid}" name="motivo" required
            aria-describedby="ayuda-${e.uid}">${escapar(borradorMotivo)}</textarea>
          <small id="ayuda-${e.uid}">La empresa verá este motivo. Es obligatorio.</small>
        </div>
        <div class="acciones">
          <button type="submit" class="boton boton--peligro">Rechazar empresa</button>
          <button type="button" class="boton boton--secundario" data-cancelar>Cancelar</button>
        </div>
      </form>`
    : "";

  return `
    <li class="fila fila--empresa">
      <div>
        <h2 class="fila__titulo">${escapar(e.nombre)}</h2>
        <p class="fila__meta"><span class="estado estado--${estado}">${ETIQUETAS[estado] || escapar(estado)}</span>${
          e.creadoEn ? ` · Se registró el ${formatearFecha(e.creadoEn)}` : ""
        }</p>
      </div>
      <div class="acciones">${botones}</div>
      <div class="empresa__detalle">
        <dl class="datos">
          <div><dt>Rubro</dt><dd>${escapar(e.rubro) || "—"}</dd></div>
          <div><dt>NIT</dt><dd>${escapar(e.nit) || "—"}</dd></div>
        </dl>
        ${e.descripcion ? `<p class="empresa__descripcion">${escapar(e.descripcion)}</p>` : ""}
        ${contacto ? `<p class="fila__meta">${contacto}</p>` : ""}
        ${estado === VALIDACION.RECHAZADA && e.motivoRechazo
          ? `<p class="empresa__motivo"><strong>Motivo del rechazo:</strong> ${escapar(e.motivoRechazo)}</p>` : ""}
        ${formulario}
      </div>
    </li>`;
}

function cerrarRechazo() {
  rechazandoId = null;
  borradorMotivo = "";
}

filtros.addEventListener("change", (evento) => {
  filtro = evento.target.value;
  pintar();
});

lista.addEventListener("input", (evento) => {
  if (evento.target.name === "motivo") borradorMotivo = evento.target.value;
});

lista.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;

  if (boton.dataset.rechazar) {
    rechazandoId = boton.dataset.rechazar;
    borradorMotivo = "";
    pintar();
    document.getElementById(`motivo-${rechazandoId}`)?.focus();
    return;
  }

  if (boton.hasAttribute("data-cancelar")) {
    cerrarRechazo();
    pintar();
    return;
  }

  const uid = boton.dataset.aprobar;
  if (!uid) return;
  const empresa = empresas.find((e) => e.uid === uid);
  boton.disabled = true;
  try {
    await aprobarEmpresa(uid);
    if (rechazandoId === uid) cerrarRechazo();
    mostrarMensaje(mensaje, `${empresa?.nombre || "La empresa"} fue aprobada y ya puede publicar ofertas.`, "exito");
  } catch (error) {
    boton.disabled = false;
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});

lista.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const formulario = evento.target;
  const uid = formulario.dataset.formulario;
  const campo = formulario.elements.motivo;
  const motivo = campo.value.trim();

  if (!motivo) {
    campo.setAttribute("aria-invalid", "true");
    mostrarMensaje(mensaje, "Escribe el motivo del rechazo.", "error");
    campo.focus();
    return;
  }

  const empresa = empresas.find((e) => e.uid === uid);
  const enviar = formulario.querySelector('button[type="submit"]');
  enviar.disabled = true;
  try {
    cerrarRechazo(); // antes de guardar: el cambio llega por onSnapshot y redibuja sin el formulario
    const cerradas = await rechazarEmpresa(uid, motivo);
    const detalle = cerradas ? ` Se ${cerradas === 1 ? "cerró 1 oferta" : `cerraron ${cerradas} ofertas`} que tenía publicadas.` : "";
    mostrarMensaje(mensaje, `${empresa?.nombre || "La empresa"} fue rechazada.${detalle}`, "exito");
  } catch (error) {
    rechazandoId = uid;
    borradorMotivo = motivo;
    pintar();
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});
