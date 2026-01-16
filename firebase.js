// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuraciones de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAJISeVTXF1CrCkp4UmQTthqGuXH7Gez0o",
    authDomain: "fmq-ranked.firebaseapp.com",
    projectId: "fmq-ranked",
    storageBucket: "fmq-ranked.firebasestorage.app",
    messagingSenderId: "903521201242",
    appId: "1:903521201242:web:00fa5ca537c6e0174a7c63"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exponer Firebase a script.js
window._firebase = {
    db,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs
};