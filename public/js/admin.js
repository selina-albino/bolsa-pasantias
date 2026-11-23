// Módulo de administración (RF09): validación de las empresas registradas.
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROLES, VALIDACION } from "./datos.js";

// Empresas registradas en tiempo real (más recientes primero).
// Se ordena en el navegador para no necesitar un índice compuesto.
// Devuelve una función para dejar de escuchar.
export function escucharEmpresas(alCambiar, alFallar) {
  const q = query(collection(db, "usuarios"), where("rol", "==", ROLES.EMPRESA));
  return onSnapshot(
    q,
    (snap) => {
      const lista = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
      alCambiar(lista);
    },
    (error) => alFallar?.(error)
  );
}

// Las reglas de Firestore solo dejan al administrador cambiar estos dos campos.
export function aprobarEmpresa(uid) {
  return updateDoc(doc(db, "usuarios", uid), {
    estadoValidacion: VALIDACION.APROBADA,
    motivoRechazo: "",
  });
}

export function rechazarEmpresa(uid, motivo) {
  const texto = String(motivo || "").trim();
  if (!texto) return Promise.reject(new Error("Escribe el motivo del rechazo."));
  return updateDoc(doc(db, "usuarios", uid), {
    estadoValidacion: VALIDACION.RECHAZADA,
    motivoRechazo: texto,
  });
}
