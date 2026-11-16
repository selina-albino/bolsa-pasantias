// Módulo de autenticación (RF01): registro, inicio de sesión, roles y protección de páginas.
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ROLES, VALIDACION } from "./datos.js";

// Página a la que va cada rol después de iniciar sesión.
export function rutaInicio(perfil) {
  if (!perfil) return "/login.html";
  if (perfil.rol === ROLES.EMPRESA) return "/empresa/panel.html";
  if (perfil.rol === ROLES.ADMIN) return "/admin/empresas.html";
  return "/index.html";
}

// Registra un estudiante o una empresa y crea su documento en la colección "usuarios".
// El administrador no se registra desde aquí: se crea a mano en la consola de Firebase.
export async function registrarUsuario(datos) {
  const { rol, correo, password, ...resto } = datos;
  if (rol !== ROLES.ESTUDIANTE && rol !== ROLES.EMPRESA) {
    throw new Error("Rol no permitido.");
  }

  const credencial = await createUserWithEmailAndPassword(auth, correo, password);
  const uid = credencial.user.uid;

  const perfil = {
    rol,
    correo,
    nombre: resto.nombre,
    whatsapp: resto.whatsapp,
    creadoEn: serverTimestamp(),
  };

  if (rol === ROLES.ESTUDIANTE) {
    perfil.carrera = resto.carrera;
    perfil.semestre = Number(resto.semestre);
  } else {
    perfil.nit = resto.nit;
    perfil.rubro = resto.rubro;
    perfil.descripcion = resto.descripcion || "";
    perfil.estadoValidacion = VALIDACION.PENDIENTE; // queda pendiente hasta que el admin la apruebe
  }

  await setDoc(doc(db, "usuarios", uid), perfil);
  return { uid, ...perfil };
}

export async function iniciarSesion(correo, password) {
  const credencial = await signInWithEmailAndPassword(auth, correo, password);
  return obtenerPerfil(credencial.user.uid);
}

export function cerrarSesion() {
  return signOut(auth);
}

export function recuperarContrasena(correo) {
  return sendPasswordResetEmail(auth, correo);
}

export async function obtenerPerfil(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Devuelve el usuario actual y su perfil cuando Firebase termina de revisar la sesión.
export function esperarUsuario() {
  return new Promise((resolve) => {
    const detener = onAuthStateChanged(auth, async (user) => {
      detener();
      if (!user) return resolve({ user: null, perfil: null });
      const perfil = await obtenerPerfil(user.uid);
      resolve({ user, perfil });
    });
  });
}

// Protege una página: si no hay sesión o el rol no corresponde, redirige.
export async function requerirRol(rolesPermitidos) {
  const { user, perfil } = await esperarUsuario();
  if (!user || !perfil) {
    window.location.href = `/login.html?volver=${encodeURIComponent(location.pathname + location.search)}`;
    return new Promise(() => {}); // detiene la carga de la página mientras redirige
  }
  if (!rolesPermitidos.includes(perfil.rol)) {
    window.location.href = rutaInicio(perfil);
    return new Promise(() => {});
  }
  return { user, perfil };
}

// Traduce los códigos de error de Firebase a mensajes para el usuario.
export function mensajeError(error) {
  const mensajes = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
    "permission-denied": "No tienes permiso para realizar esta acción.",
  };
  return mensajes[error?.code] || error?.message || "Ocurrió un error. Intenta de nuevo.";
}
