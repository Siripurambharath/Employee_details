// src/Firebase/Firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDXrWxEk2BcCwo8GGaF8hYrr-S5xL2F-Ms",
  authDomain: "employee-project-8c41c.firebaseapp.com",
  projectId: "employee-project-8c41c",
  storageBucket: "employee-project-8c41c.appspot.com", 
  messagingSenderId: "1018939673021",
  appId: "1:1018939673021:web:2c0fd20823a8ee776b2ad4",
  measurementId: "G-JM66E2DJMN",
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, functions, googleProvider };
