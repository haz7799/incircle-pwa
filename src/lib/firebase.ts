import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFqi8kJi15SOQ63FTOjhYQ5vfVdE2lR54",
  authDomain: "incircle-pwa.firebaseapp.com",
  projectId: "incircle-pwa",
  storageBucket: "incircle-pwa.firebasestorage.app",
  messagingSenderId: "1029221290070",
  appId: "1:1029221290070:web:9937347e2ff2994bacabf7"
};

// 避免在 Next.js 開發環境中重複初始化
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };