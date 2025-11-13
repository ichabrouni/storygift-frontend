import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYYK2__D_8oh_zl8pkyElZiGLewupss1s",
  authDomain: "flexpayzcom.firebaseapp.com",
  databaseURL: "https://flexpayzcom-default-rtdb.firebaseio.com",
  projectId: "flexpayzcom",
  storageBucket: "flexpayzcom.firebasestorage.app",
  messagingSenderId: "556480382433",
  appId: "1:556480382433:web:0afae9fd02a6c3ce19fea0",
  measurementId: "G-RCZCF3Y28V"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// sanity check
console.log("🔥 Connected to project:", app.options.projectId);