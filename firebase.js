// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB0VOaOdSjihMKf6rn2xx92t2nSLMCBQzY",
    authDomain: "tihomcart.firebaseapp.com",
    databaseURL: "https://tihomcart-default-rtdb.firebaseio.com",
    projectId: "tihomcart",
    storageBucket: "tihomcart.appspot.com",
    messagingSenderId: "988030075535",
    appId: "1:988030075535:web:d7a939afb2c972b11a66fa"
    
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, auth, db };