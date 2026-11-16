// Panel de la empresa: sus ofertas, con ver, editar y cerrar (RF03).
import { requerirRol, mensajeError } from "../auth.js";
import { listarOfertasDeEmpresa, cambiarEstadoOferta } from "../ofertas.js";
import { pintarCabecera, mostrarMensaje, escapar, datosPlazo } from "../ui.js";
import { ROLES, VALIDACION, ESTADO_OFERTA } from "../datos.js";

pintarCabecera();

const { perfil } = await requerirRol([ROLES.EMPRESA]);

const estadoCuenta = document.getElementById("estado-cuenta");
const mensaje = document.getElementById("mensaje");
const lista = document.getElementById("lista-ofertas");
const conteo = document.getElementById("conteo");
const botonPublicar = document.getElementById("boton-publicar");
const aprobada = perfil.estadoValidacion === VALIDACION.APROBADA;

// Estado de validación de la empresa (RF09)
if (aprobada) {
  botonPublicar.hidden = false;
} else if (perfil.estadoValidacion === VALIDACION.RECHAZADA) {
  const motivo = perfil.motivoRechazo ? ` Motivo: ${perfil.motivoRechazo}` : "";
  mostrarMensaje(estadoCuenta, `El administrador rechazó tu empresa, por eso no puedes publicar ofertas.${motivo}`, "error");
} else {
  mostrarMensaje(estadoCuenta, "Tu empresa está pendiente de validación. Podrás publicar ofertas cuando el administrador la apruebe.", "aviso");
}

async function cargar() {
  try {
    const ofertas = await listarOfertasDeEmpresa(perfil.uid);
    const abiertas = ofertas.filter((o) => o.estado === ESTADO_OFERTA.ABIERTA).length;
    conteo.textContent = ofertas.length
      ? `${abiertas} ${abiertas === 1 ? "abierta" : "abiertas"} de ${ofertas.length} ${ofertas.length === 1 ? "publicada" : "publicadas"}`
      : "";

    lista.innerHTML = ofertas.length
      ? ofertas.map(fila).join("")
      : `<li class="vacio"><strong>Todavía no publicaste ofertas</strong>${
          aprobada ? "Publica la primera y aparecerá en la portada para los estudiantes." : "Cuando aprueben tu empresa podrás publicar."
        }</li>`;
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
}

function fila(o) {
  const abierta = o.estado === ESTADO_OFERTA.ABIERTA;
  const plazo = datosPlazo(o.fechaLimite);
  return `
    <li class="fila ${abierta ? "" : "fila--cerrada"}">
      <div>
        <h2 class="fila__titulo">${escapar(o.titulo)}</h2>
        <p class="fila__meta">
          <span class="estado estado--${o.estado}">${abierta ? "Abierta" : "Cerrada"}</span>
          &nbsp; ${escapar(o.tipo)}, ${escapar(o.modalidad).toLowerCase()}. Cierre: ${plazo.dia} ${plazo.mes}
        </p>
      </div>
      <div class="acciones">
        <a class="boton boton--secundario" href="/oferta.html?id=${o.id}">Ver</a>
        <a class="boton boton--secundario" href="/empresa/oferta.html?id=${o.id}">Editar</a>
        ${abierta ? `<button type="button" class="boton boton--peligro" data-cerrar="${o.id}">Cerrar oferta</button>` : ""}
      </div>
    </li>`;
}

// RF03: cerrar oferta
lista.addEventListener("click", async (evento) => {
  const id = evento.target.dataset.cerrar;
  if (!id) return;
  if (!confirm("¿Cerrar esta oferta? Dejará de aparecer en la portada y no recibirá más postulaciones.")) return;
  try {
    await cambiarEstadoOferta(id, ESTADO_OFERTA.CERRADA);
    mostrarMensaje(mensaje, "Oferta cerrada.", "exito");
    cargar();
  } catch (error) {
    mostrarMensaje(mensaje, mensajeError(error), "error");
  }
});

cargar();
