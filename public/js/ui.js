// Elementos comunes de la interfaz: barra de navegación, mensajes y utilidades.
import { esperarUsuario, cerrarSesion } from "./auth.js";
import { ROLES } from "./datos.js";

// Dibuja la barra de navegación según la sesión. Cada página tiene <header id="cabecera"></header>.
export async function pintarCabecera() {
  const cabecera = document.getElementById("cabecera");
  if (!cabecera) return;

  const { perfil } = await esperarUsuario();
  const enlaces = [`<a href="/index.html">Ofertas</a>`];

  if (perfil?.rol === ROLES.EMPRESA) {
    enlaces.push(`<a href="/empresa/panel.html">Mis ofertas</a>`);
  }
  if (perfil?.rol === ROLES.ESTUDIANTE) {
    enlaces.push(`<a href="/estudiante/postulaciones.html">Mis postulaciones</a>`);
  }
  if (perfil?.rol === ROLES.ADMIN) {
    enlaces.push(`<a href="/admin/empresas.html">Validar empresas</a>`);
  }

  const cuenta = perfil
    ? `<span class="cabecera__usuario">${escapar(perfil.nombre)}</span>
       <button type="button" class="boton boton--secundario" id="boton-salir">Cerrar sesión</button>`
    : `<a href="/login.html" class="boton boton--secundario">Iniciar sesión</a>
       <a href="/registro.html" class="boton">Crear cuenta</a>`;

  cabecera.className = "cabecera";
  cabecera.innerHTML = `
    <div class="cabecera__interior">
      <a href="/index.html" class="marca" aria-label="CampusJob, inicio">Campus<span>Job</span></a>
      <nav class="cabecera__nav" aria-label="Principal">${enlaces.join("")}</nav>
      <div class="cabecera__cuenta">${cuenta}</div>
    </div>`;

  // Marca la página actual en el menú
  cabecera.querySelectorAll(".cabecera__nav a").forEach((a) => {
    const ruta = new URL(a.href).pathname;
    const actual = location.pathname === "/" ? "/index.html" : location.pathname;
    if (ruta === actual) a.setAttribute("aria-current", "page");
  });

  if (perfil?.rol === ROLES.EMPRESA) avisarPostulacionesNuevas(cabecera, perfil.uid);

  document.getElementById("boton-salir")?.addEventListener("click", async () => {
    await cerrarSesion();
    window.location.href = "/index.html";
  });
}

// Avisos de la empresa: insignia con el número de postulaciones nuevas junto a "Mis ofertas"
// y el número en el título de la pestaña, por ejemplo "(3) Mis ofertas | CampusJob".
async function avisarPostulacionesNuevas(cabecera, empresaId) {
  const { escucharPostulacionesNuevas } = await import("./postulaciones.js");
  const enlace = cabecera.querySelector('.cabecera__nav a[href="/empresa/panel.html"]');
  const tituloOriginal = document.title;
  const insignia = document.createElement("span");
  insignia.className = "insignia";
  insignia.hidden = true;
  enlace?.append(insignia);

  escucharPostulacionesNuevas(empresaId, ({ total }) => {
    insignia.hidden = total === 0;
    insignia.textContent = total > 99 ? "99+" : String(total);
    insignia.setAttribute("aria-label", `${total} ${total === 1 ? "postulación nueva" : "postulaciones nuevas"}`);
    document.title = total ? `(${total}) ${tituloOriginal}` : tituloOriginal;
  });
}

// Muestra un mensaje en un contenedor con role="status" o role="alert".
export function mostrarMensaje(contenedor, texto, tipo = "info") {
  contenedor.textContent = texto;
  contenedor.className = `mensaje mensaje--${tipo}`;
  contenedor.hidden = !texto;
}

// Evita que el texto escrito por usuarios se interprete como HTML.
export function escapar(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// "2026-11-30" -> "30/11/2026"
export function formatearFecha(valor) {
  if (!valor) return "";
  if (typeof valor === "string") {
    const [a, m, d] = valor.split("-");
    return `${d}/${m}/${a}`;
  }
  const fecha = valor.toDate ? valor.toDate() : new Date(valor);
  return fecha.toLocaleDateString("es-BO");
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Datos para el talón de fecha de cierre: día, mes y cuántos días faltan.
export function datosPlazo(fechaISO) {
  if (!fechaISO) return { dia: "--", mes: "", nota: "sin fecha", pronto: false };
  const [a, m, d] = fechaISO.split("-").map(Number);
  const cierre = new Date(a, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const faltan = Math.round((cierre - hoy) / 86400000);

  let nota = `cierra en ${faltan} días`;
  if (faltan < 0) nota = "cerró";
  else if (faltan === 0) nota = "cierra hoy";
  else if (faltan === 1) nota = "cierra mañana";

  return { dia: String(d).padStart(2, "0"), mes: MESES[m - 1], nota, pronto: faltan >= 0 && faltan <= 3 };
}

export function hoyISO() {
  const hoy = new Date();
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

// Arma un enlace de WhatsApp (RF08). El número se guarda con código de país, ej. 59170000000.
export function enlaceWhatsApp(numero, mensaje) {
  const limpio = String(numero || "").replace(/\D/g, "");
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

// Marca como inválidos los campos obligatorios que solo tienen espacios.
// Llamar antes de form.reportValidity().
export function exigirTexto(form) {
  form.querySelectorAll("input[required]:not([type=radio]):not([type=checkbox]):not([type=file]), textarea[required]")
    .forEach((campo) => {
      if (campo.disabled) return;
      const enBlanco = campo.value.length > 0 && campo.value.trim() === "";
      campo.setCustomValidity(enBlanco ? "Este campo no puede tener solo espacios." : "");
    });
}
