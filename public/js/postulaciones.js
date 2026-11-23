// Módulo de postulaciones (RF06, RF07, RF08).
// El CV se guarda en Firestore como texto (base64) porque el plan gratuito de Firebase
// no incluye Storage. Por eso el PDF tiene un límite de 700 KB.
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const TAMANO_MAXIMO_CV = 700 * 1024; // 700 KB

// El id combina oferta y estudiante: así no se puede postular dos veces a la misma oferta.
export function idPostulacion(ofertaId, estudianteId) {
  return `${ofertaId}_${estudianteId}`;
}

export async function obtenerMiPostulacion(ofertaId, estudianteId) {
  const snap = await getDoc(doc(db, "postulaciones", idPostulacion(ofertaId, estudianteId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Revisa el archivo antes de subirlo (diagrama de actividades "Postular con CV").
export function validarCV(archivo) {
  if (!archivo) return "Selecciona tu CV en PDF.";
  const esPdf = archivo.type === "application/pdf" || archivo.name.toLowerCase().endsWith(".pdf");
  if (!esPdf) return "El CV debe estar en formato PDF.";
  if (archivo.size > TAMANO_MAXIMO_CV) return "El CV no puede pesar más de 700 KB. Puedes comprimirlo en ilovepdf.com.";
  return null;
}

// Convierte el PDF en texto "data:application/pdf;base64,..." para guardarlo en Firestore.
function leerComoDataURL(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(archivo);
  });
}

// RF06: guarda la postulación (estado "Enviada") y el CV en una sola operación.
// Si algo falla, no se guarda ninguno de los dos.
export async function postular(oferta, estudiante, archivo) {
  const error = validarCV(archivo);
  if (error) throw new Error(error);

  const id = idPostulacion(oferta.id, estudiante.uid);
  const contenido = await leerComoDataURL(archivo);

  const lote = writeBatch(db);
  lote.set(doc(db, "postulaciones", id), {
    ofertaId: oferta.id,
    ofertaTitulo: oferta.titulo,
    empresaId: oferta.empresaId,
    empresaNombre: oferta.empresaNombre,
    empresaWhatsapp: oferta.empresaWhatsapp || "",
    estudianteId: estudiante.uid,
    estudianteNombre: estudiante.nombre,
    estudianteCorreo: estudiante.correo || "",
    estudianteCarrera: estudiante.carrera || "",
    estudianteSemestre: estudiante.semestre || "",
    estudianteWhatsapp: estudiante.whatsapp || "",
    cvNombre: archivo.name,
    estado: "Enviada",
    fecha: serverTimestamp(),
    // Historial de estados para RF07 (cada cambio con su fecha)
    historial: [{ estado: "Enviada", fecha: Timestamp.now() }],
  });
  lote.set(doc(db, "cvs", id), {
    ofertaId: oferta.id,
    empresaId: oferta.empresaId,
    estudianteId: estudiante.uid,
    nombre: archivo.name,
    contenido,
    subidoEn: serverTimestamp(),
  });
  await lote.commit();
  return id;
}

// Postulaciones de una oferta, para la empresa dueña (más recientes primero).
export async function listarPostulantes(ofertaId, empresaId) {
  const q = query(
    collection(db, "postulaciones"),
    where("ofertaId", "==", ofertaId),
    where("empresaId", "==", empresaId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
}

// RF07: la empresa cambia el estado y queda registrado en el historial.
export function cambiarEstadoPostulacion(id, estado) {
  return updateDoc(doc(db, "postulaciones", id), {
    estado,
    historial: arrayUnion({ estado, fecha: Timestamp.now() }),
    actualizadoEn: serverTimestamp(),
  });
}

// Abre el CV en una pestaña nueva con el visor de PDF del navegador.
export async function abrirCV(id) {
  const snap = await getDoc(doc(db, "cvs", id));
  if (!snap.exists()) throw new Error("Esta postulación no tiene CV guardado.");
  const archivo = await (await fetch(snap.data().contenido)).blob();
  const url = URL.createObjectURL(archivo);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Avisos para la empresa: postulaciones nuevas = las que todavía están "Enviada"
// (la empresa no abrió el CV ni cambió el estado). Se actualiza en tiempo real.
// Devuelve una función para dejar de escuchar.
export function escucharPostulacionesNuevas(empresaId, alCambiar) {
  const q = query(
    collection(db, "postulaciones"),
    where("empresaId", "==", empresaId),
    where("estado", "==", "Enviada")
  );
  return onSnapshot(
    q,
    (snap) => {
      const porOferta = {};
      snap.docs.forEach((d) => {
        const { ofertaId } = d.data();
        porOferta[ofertaId] = (porOferta[ofertaId] || 0) + 1;
      });
      alCambiar({ total: snap.size, porOferta });
    },
    () => alCambiar({ total: 0, porOferta: {} })
  );
}

// RF07: postulaciones del estudiante en tiempo real (más recientes primero).
// Se ordena en el navegador para no necesitar un índice compuesto.
// Devuelve una función para dejar de escuchar.
export function escucharMisPostulaciones(estudianteId, alCambiar, alFallar) {
  const q = query(collection(db, "postulaciones"), where("estudianteId", "==", estudianteId));
  return onSnapshot(
    q,
    (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
      alCambiar(lista);
    },
    (error) => alFallar?.(error)
  );
}
