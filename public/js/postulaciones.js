// Módulo de postulaciones (RF06): postular con CV en PDF.
import { db, storage } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export const TAMANO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB

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
  if (archivo.size > TAMANO_MAXIMO_CV) return "El CV no puede pesar más de 5 MB.";
  return null;
}

// Sube el CV a Storage y registra la postulación con estado "Enviada".
export async function postular(oferta, estudiante, archivo) {
  const error = validarCV(archivo);
  if (error) throw new Error(error);

  const cvPath = `cvs/${estudiante.uid}/${oferta.id}/cv.pdf`;
  await uploadBytes(ref(storage, cvPath), archivo, { contentType: "application/pdf" });

  const id = idPostulacion(oferta.id, estudiante.uid);
  const datos = {
    ofertaId: oferta.id,
    ofertaTitulo: oferta.titulo,
    empresaId: oferta.empresaId,
    empresaNombre: oferta.empresaNombre,
    empresaWhatsapp: oferta.empresaWhatsapp || "",
    estudianteId: estudiante.uid,
    estudianteNombre: estudiante.nombre,
    estudianteCarrera: estudiante.carrera || "",
    estudianteSemestre: estudiante.semestre || "",
    estudianteWhatsapp: estudiante.whatsapp || "",
    cvPath,
    estado: "Enviada",
    fecha: serverTimestamp(),
    // Historial de estados para RF07 (cada cambio con su fecha)
    historial: [{ estado: "Enviada", fecha: Timestamp.now() }],
  };

  await setDoc(doc(db, "postulaciones", id), datos);
  return id;
}
