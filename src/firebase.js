import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyCDX8sVEYV9DkKYbzuH3seWODSHT9Dgeo0",
  authDomain: "yorletter-e2ca3.firebaseapp.com",
  projectId: "yorletter-e2ca3",        
  storageBucket: "yorletter-e2ca3.firebasestorage.app",
  messagingSenderId: "168438529869",
  appId: "1:168438529869:web:d11dc1066425f3d0c28104"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);