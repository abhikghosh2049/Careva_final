import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config copied from CarevaFrontend-main/public/script.js
const firebaseConfig = {
  apiKey: "AIzaSyCQj0p20mqV4jSsSzBpjIy0IrdU4s9sg7s",
  authDomain: "authentication-25cfa.firebaseapp.com",
  projectId: "authentication-25cfa",
  storageBucket: "authentication-25cfa.firebasestorage.app",
  messagingSenderId: "645752213769",
  appId: "1:645752213769:web:2bc01cace98e4b8c2e43d8",
  measurementId: "G-VKRYXEEQS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;