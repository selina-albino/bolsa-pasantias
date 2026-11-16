// Configuración de Firebase.
// Reemplazar estos valores con los del proyecto:
// Consola de Firebase > Configuración del proyecto > Tus apps > App web > SDK setup and configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcS8OJkoSijMZvRDsn6NWsUvPxykiZElg",
  authDomain: "bolsa-pasantias-ucatec.firebaseapp.com",
  projectId: "bolsa-pasantias-ucatec",
  storageBucket: "bolsa-pasantias-ucatec.firebasestorage.app",
  messagingSenderId: "681018072824",
  appId: "1:681018072824:web:beea4976f4c9bd1327650d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
