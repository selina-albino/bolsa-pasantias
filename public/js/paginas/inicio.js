// Listado de ofertas abiertas. Los filtros (RF04) se agregan sobre este listado.
import { listarOfertasAbiertas } from "../ofertas.js";
import { mensajeError } from "../auth.js";
import { pintarCabecera, mostrarMensaje, escapar, formatearFecha } from "../ui.js";

pintarCabecera();

const lista = document.getElementById("lista-ofertas");
const mensaje = document.getElementById("mensaje");

export function tarjetaOferta(o) {
  return `
    <article class="tarjeta">
      <h2>${escapar(o.titulo)}</h2>
      <p class="oferta__empresa">${escapar(o.empresaNombre)}</p>
      <ul class="oferta__datos">
        <li class="etiqueta">${escapar(o.tipo)}</li>
        <li class="etiqueta">${escapar(o.modalidad)}</li>
      </ul>
      <p>Postulación hasta: <strong>${formatearFecha(o.fechaLimite)}</strong></p>
      <a class="boton" href="/oferta.html?id=${o.id}">Ver detalle</a>
    </article>`;
}

try {
  const ofertas = await listarOfertasAbiertas();
  lista.innerHTML = ofertas.length
    ? ofertas.map(tarjetaOferta).join("")
    : `<p class="vacio">Por ahora no hay ofertas abiertas.</p>`;
} catch (error) {
  lista.innerHTML = "";
  mostrarMensaje(mensaje, mensajeError(error), "error");
}
