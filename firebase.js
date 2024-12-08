// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCilinRwCcIuouJ-B9hxLkAYCrv8nOL7o",
  authDomain: "whatsapp-ef326.firebaseapp.com",
  projectId: "whatsapp-ef326",
  storageBucket: "whatsapp-ef326.firebasestorage.app",
  messagingSenderId: "656180878734",
  appId: "1:656180878734:web:8c3e4d2f354e28370298df",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const database = getDatabase(app);

export { auth, database };
