// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;