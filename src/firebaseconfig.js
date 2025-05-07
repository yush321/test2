// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvrQL9E7Cg6X1JMBNMEYyaXwGjGKDd9F8",
    authDomain: "test2-12df6.firebaseapp.com",
    projectId: "test2-12df6",
    storageBucket: "test2-12df6.firebasestorage.app",
    messagingSenderId: "643924224901",
    appId: "1:643924224901:web:0eeb4daf801f224530f2ec",
    measurementId: "G-ZSTR56D0PW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, 'asia-northeast3'); // functions 리전 설정 (Firebase 프로젝트 설정과 동일하게)

// Firebase Functions 호출 함수
const findRecipesFunction = httpsCallable(functions, 'findRecipes');

console.log('[firebaseconfig.js] 정의된 findRecipesFunction:', findRecipesFunction);
console.log('[firebaseconfig.js] typeof findRecipesFunction:', typeof findRecipesFunction);

export { db, findRecipesFunction };