import { iniciarSesion, recuperarContrasena, rutaInicio, mensajeError } from "../auth.js";
import { pintarCabecera, mostrarMensaje, parametro } from "../ui.js";

pintarCabecera();

// Solo acepta rutas del propio sitio ("/empresa/panel.html"). Así nadie puede armar un enlace
// de login que lleve a otra página (https://...) o que ejecute código (javascript:...).
function rutaSegura(ruta) {
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.startsWith("/\\")) return null;
  return ruta;
}

const form = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!form.reportValidity()) return;

  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;
  mostrarMensaje(mensaje, "");

  try {
    const perfil = await iniciarSesion(form.correo.value.trim(), form.password.value);
    window.location.href = rutaSegura(parametro("volver")) || rutaInicio(perfil);
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
    boton.disabled = false;
  }
});

document.getElementById("boton-recuperar").addEventListener("click", async () => {
  const correo = form.correo.value.trim();
  if (!correo) {
    mostrarMensaje(mensaje, "Escribe tu correo para enviarte el enlace de recuperación.", "aviso");
    form.correo.focus();
    return;
  }
  try {
    await recuperarContrasena(correo);
    mostrarMensaje(mensaje, `Te enviamos un enlace a ${correo} para crear una nueva contraseña.`, "exito");
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});
