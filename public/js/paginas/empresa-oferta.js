// Formulario para publicar (RF02) o editar (RF03) una oferta. Con ?id= edita.
import { requerirRol, mensajeError } from "../auth.js";
import { crearOferta, actualizarOferta, obtenerOferta, CAMPOS_OFERTA } from "../ofertas.js";
import { pintarCabecera, mostrarMensaje, escapar, hoyISO, parametro } from "../ui.js";
import { CARRERAS, TIPOS, MODALIDADES, ROLES, VALIDACION } from "../datos.js";

pintarCabecera();

const { perfil } = await requerirRol([ROLES.EMPRESA]);

const form = document.getElementById("form-oferta");
const mensaje = document.getElementById("mensaje");
const aviso = document.getElementById("aviso");
const contCarreras = document.getElementById("carreras");
const errorCarreras = document.getElementById("error-carreras");
const id = parametro("id");

// Llenar opciones
contCarreras.innerHTML = CARRERAS.map(
  (c) => `<label><input type="checkbox" name="carreras" value="${escapar(c)}"> ${escapar(c)}</label>`
).join("");
form.tipo.innerHTML = `<option value="">Selecciona</option>` + TIPOS.map((t) => `<option>${t}</option>`).join("");
form.modalidad.innerHTML =
  `<option value="">Selecciona</option>` + MODALIDADES.map((m) => `<option>${m}</option>`).join("");
form.fechaLimite.min = hoyISO();

// Solo una empresa aprobada puede publicar (diagrama de actividades "Publicar oferta")
if (perfil.estadoValidacion !== VALIDACION.APROBADA) {
  mostrarMensaje(aviso, "Cuenta pendiente de validación. No puedes publicar ofertas todavía.", "aviso");
  form.querySelectorAll("input, textarea, select, button").forEach((c) => (c.disabled = true));
}

// Modo edición: cargar la oferta
if (id) {
  document.getElementById("titulo").textContent = "Editar oferta";
  document.title = "Editar oferta | Bolsa de Pasantías";
  document.getElementById("boton-guardar").textContent = "Guardar cambios";

  const oferta = await obtenerOferta(id).catch(() => null);
  if (!oferta || oferta.empresaId !== perfil.uid) {
    mostrarMensaje(mensaje, "No se encontró la oferta o no te pertenece.", "error");
    form.querySelectorAll("input, textarea, select, button").forEach((c) => (c.disabled = true));
  } else {
    for (const campo of CAMPOS_OFERTA) {
      if (campo === "carreras") continue;
      form.elements[campo].value = oferta[campo] ?? "";
    }
    form.querySelectorAll("input[name=carreras]").forEach((c) => {
      c.checked = (oferta.carreras || []).includes(c.value);
    });
    form.fechaLimite.min = ""; // al editar se permite mantener la fecha original
  }
}

function leerFormulario() {
  const datos = {};
  for (const campo of CAMPOS_OFERTA) {
    if (campo === "carreras") continue;
    datos[campo] = form.elements[campo].value.trim();
  }
  datos.carreras = [...form.querySelectorAll("input[name=carreras]:checked")].map((c) => c.value);
  return datos;
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, "");

  const datos = leerFormulario();
  const sinCarreras = datos.carreras.length === 0;
  errorCarreras.hidden = !sinCarreras;
  errorCarreras.className = sinCarreras ? "mensaje mensaje--error" : "";

  if (!form.reportValidity() || sinCarreras) {
    mostrarMensaje(mensaje, "Completa todos los campos obligatorios.", "error");
    return;
  }

  const boton = document.getElementById("boton-guardar");
  boton.disabled = true;

  try {
    if (id) {
      await actualizarOferta(id, datos);
    } else {
      await crearOferta(perfil, datos);
    }
    window.location.href = "/empresa/panel.html";
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
    boton.disabled = false;
  }
});
