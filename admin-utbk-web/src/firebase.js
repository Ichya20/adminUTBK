import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 🚀 Tambahkan import ini

const firebaseConfig = {
  apiKey: "AIzaSyAmG9xylDAE7_BofZjiSbLly0VOFFXfNTI",
  authDomain: "utbk-snbt-app.firebaseapp.com",
  projectId: "utbk-snbt-app",
  storageBucket: "utbk-snbt-app.firebasestorage.app",
  messagingSenderId: "429157683797",
  appId: "1:429157683797:web:a02dca15b0631560823adc",
  measurementId: "G-1G5CEM1QXZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 🚀 Tambahkan export ini