import { registrarUsuario, rutaInicio, mensajeError } from "../auth.js";
import { pintarCabecera, mostrarMensaje } from "../ui.js";
import { CARRERAS, ROLES } from "../datos.js";

pintarCabecera();

const form = document.getElementById("form-registro");
const mensaje = document.getElementById("mensaje");
const bloqueEstudiante = document.getElementById("datos-estudiante");
const bloqueEmpresa = document.getElementById("datos-empresa");
const etiquetaNombre = document.getElementById("etiqueta-nombre");
const lema = document.getElementById("lema");
const lemaDetalle = document.getElementById("lema-detalle");

// Llenar listas desplegables
form.carrera.innerHTML =
  `<option value="">Selecciona tu carrera</option>` +
  CARRERAS.map((c) => `<option>${c}</option>`).join("");
form.semestre.innerHTML =
  `<option value="">Selecciona</option>` +
  Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}.º semestre</option>`).join("");

// Mostrar los campos del rol elegido. Los campos ocultos se deshabilitan para que no se validen.
function cambiarRol() {
  const esEmpresa = form.rol.value === ROLES.EMPRESA;
  bloqueEmpresa.hidden = !esEmpresa;
  bloqueEstudiante.hidden = esEmpresa;
  bloqueEmpresa.querySelectorAll("input, textarea").forEach((c) => (c.disabled = !esEmpresa));
  bloqueEstudiante.querySelectorAll("select").forEach((c) => (c.disabled = esEmpresa));
  etiquetaNombre.textContent = esEmpresa ? "Nombre de la empresa" : "Nombre completo";
  form.nombre.autocomplete = esEmpresa ? "organization" : "name";
  lema.textContent = esEmpresa
    ? "Publica pasantías y recibe postulantes de la carrera que necesitas."
    : "Encuentra pasantías para tu carrera y postula con tu CV.";
  lemaDetalle.textContent = esEmpresa
    ? "Revisas los CV, cambias el estado de cada postulación y contactas por WhatsApp."
    : "Filtra por carrera, modalidad y tipo, y sigue el estado de cada postulación.";
}

form.querySelectorAll("input[name=rol]").forEach((r) => r.addEventListener("change", cambiarRol));
cambiarRol();

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, "");

  if (form.password.value !== form.password2.value) {
    form.password2.setCustomValidity("Las contraseñas no coinciden.");
  } else {
    form.password2.setCustomValidity("");
  }
  if (!form.reportValidity()) return;

  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;

  const datos = Object.fromEntries(new FormData(form));
  delete datos.password2;
  datos.correo = datos.correo.trim();
  datos.nombre = datos.nombre.trim();

  try {
    const perfil = await registrarUsuario(datos);
    window.location.href = rutaInicio(perfil);
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
    boton.disabled = false;
  }
});
