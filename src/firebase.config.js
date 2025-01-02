import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZepX9NZxDhQEQvNtTMUa89s4GvVdR9mw",
  authDomain: "greensproutschools.firebaseapp.com",
  databaseURL: "https://greensproutschools.firebaseio.com",
  projectId: "greensproutschools",
  storageBucket: "greensproutschools.firebasestorage.app",
  messagingSenderId: "718402371161",
  appId: "1:718402371161:web:b42df394a362dc737bfb48",
  measurementId: "G-QGJYFW078J"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;