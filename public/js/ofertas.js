// Módulo de ofertas (RF02, RF03, RF05): publicar, editar, cerrar, listar y ver detalle.
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ESTADO_OFERTA } from "./datos.js";

const ofertasRef = collection(db, "ofertas");

// Campos que la empresa llena en el formulario (RF02).
export const CAMPOS_OFERTA = [
  "titulo",
  "descripcion",
  "requisitos",
  "carreras",
  "tipo",
  "modalidad",
  "ubicacion",
  "horario",
  "fechaLimite",
];

export async function crearOferta(empresa, datos) {
  const ref = await addDoc(ofertasRef, {
    ...datos,
    empresaId: empresa.uid,
    empresaNombre: empresa.nombre,
    empresaWhatsapp: empresa.whatsapp,
    estado: ESTADO_OFERTA.ABIERTA,
    creadaEn: serverTimestamp(),
    actualizadaEn: serverTimestamp(),
  });
  return ref.id;
}

export function actualizarOferta(id, datos) {
  return updateDoc(doc(db, "ofertas", id), { ...datos, actualizadaEn: serverTimestamp() });
}

// RF03: una oferta cerrada deja de mostrarse y no recibe postulaciones.
export function cambiarEstadoOferta(id, estado) {
  return updateDoc(doc(db, "ofertas", id), { estado, actualizadaEn: serverTimestamp() });
}

export async function obtenerOferta(id) {
  const snap = await getDoc(doc(db, "ofertas", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listarOfertasAbiertas() {
  const q = query(ofertasRef, where("estado", "==", ESTADO_OFERTA.ABIERTA), orderBy("creadaEn", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listarOfertasDeEmpresa(empresaId) {
  const q = query(ofertasRef, where("empresaId", "==", empresaId), orderBy("creadaEn", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
