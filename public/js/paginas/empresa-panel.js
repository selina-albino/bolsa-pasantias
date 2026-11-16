import { requerirRol, mensajeError } from "../auth.js";
import { listarOfertasDeEmpresa, cambiarEstadoOferta } from "../ofertas.js";
import { pintarCabecera, mostrarMensaje, escapar, formatearFecha } from "../ui.js";
import { ROLES, VALIDACION, ESTADO_OFERTA } from "../datos.js";

pintarCabecera();

const { perfil } = await requerirRol([ROLES.EMPRESA]);

const estadoCuenta = document.getElementById("estado-cuenta");
const mensaje = document.getElementById("mensaje");
const lista = document.getElementById("lista-ofertas");
const botonPublicar = document.getElementById("boton-publicar");

// Estado de validación de la empresa (RF09)
if (perfil.estadoValidacion === VALIDACION.APROBADA) {
  botonPublicar.hidden = false;
} else if (perfil.estadoValidacion === VALIDACION.RECHAZADA) {
  const motivo = perfil.motivoRechazo ? ` Motivo: ${perfil.motivoRechazo}` : "";
  mostrarMensaje(estadoCuenta, `Tu cuenta fue rechazada por el administrador y no puedes publicar ofertas.${motivo}`, "error");
} else {
  mostrarMensaje(estadoCuenta, "Cuenta pendiente de validación. Podrás publicar ofertas cuando el administrador apruebe tu empresa.", "aviso");
}

async function cargar() {
  try {
    const ofertas = await listarOfertasDeEmpresa(perfil.uid);
    if (ofertas.length === 0) {
      lista.innerHTML = `<p class="vacio">Todavía no publicaste ofertas.</p>`;
      return;
    }
    lista.innerHTML = ofertas.map(tarjeta).join("");
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
}

function tarjeta(o) {
  const abierta = o.estado === ESTADO_OFERTA.ABIERTA;
  return `
    <article class="tarjeta">
      <span class="etiqueta etiqueta--${o.estado}">${abierta ? "Abierta" : "Cerrada"}</span>
      <h2>${escapar(o.titulo)}</h2>
      <ul class="oferta__datos">
        <li class="etiqueta">${escapar(o.tipo)}</li>
        <li class="etiqueta">${escapar(o.modalidad)}</li>
      </ul>
      <p>Postulación hasta: <strong>${formatearFecha(o.fechaLimite)}</strong></p>
      <div class="acciones">
        <a class="boton boton--secundario" href="/oferta.html?id=${o.id}">Ver</a>
        <a class="boton boton--secundario" href="/empresa/oferta.html?id=${o.id}">Editar</a>
        ${abierta ? `<button type="button" class="boton boton--peligro" data-cerrar="${o.id}">Cerrar</button>` : ""}
      </div>
    </article>`;
}

// RF03: cerrar oferta
lista.addEventListener("click", async (evento) => {
  const id = evento.target.dataset.cerrar;
  if (!id) return;
  if (!confirm("¿Cerrar esta oferta? Ya no se mostrará en la búsqueda ni recibirá postulaciones.")) return;
  try {
    await cambiarEstadoOferta(id, ESTADO_OFERTA.CERRADA);
    mostrarMensaje(mensaje, "Oferta cerrada.", "exito");
    cargar();
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});

cargar();
