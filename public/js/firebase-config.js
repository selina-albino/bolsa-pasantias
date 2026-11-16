// Configuración de Firebase.
// Reemplazar estos valores con los del proyecto:
// Consola de Firebase > Configuración del proyecto > Tus apps > App web > SDK setup and configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "PEGAR_API_KEY",
  authDomain: "PEGAR_PROYECTO.firebaseapp.com",
  projectId: "PEGAR_PROYECTO",
  storageBucket: "PEGAR_PROYECTO.firebasestorage.app",
  messagingSenderId: "PEGAR_SENDER_ID",
  appId: "PEGAR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
