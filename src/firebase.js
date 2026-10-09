import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {    
    apiKey: "AIzaSyAEKpDQDDhx18XOYG0p2N3rCeytM2sve_M",    
    authDomain: "sabores-fb6c3.firebaseapp.com",    
    projectId: "sabores-fb6c3",    
    storageBucket: "sabores-fb6c3.firebasestorage.app",    
    messagingSenderId: "399792997126",    
    appId: "1:399792997126:web:95f39c1f23f590e44b9487"  }; 

// Inicializa Firebase y exporta la conexión a la base de datos
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();