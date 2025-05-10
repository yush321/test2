   // src/firebaseconfig.js (리전 지정 제거 또는 us-central1 명시)

    import { initializeApp } from "firebase/app";
    import { getFirestore } from "firebase/firestore";
    import { getFunctions, httpsCallable } from 'firebase/functions';
    // App Check 관련 코드는 현재 제거된 상태입니다.

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
    // --- 👇 리전 지정 제거 또는 us-central1로 명시 👇 ---
    const functions = getFunctions(app); // 리전 지정을 생략하면 프로젝트 기본 리전(현재 us-central1)을 사용
    // 또는 명시적으로: const functions = getFunctions(app, "us-central1");
    // --- 👆 리전 지정 제거 또는 us-central1로 명시 👆 ---

    // Firebase Functions 호출 함수 정의
    const findRecipesFunction = httpsCallable(functions, 'findRecipes');

    console.log('[firebaseconfig.js] 정의된 findRecipesFunction:', findRecipesFunction);
    console.log('[firebaseconfig.js] typeof findRecipesFunction:', typeof findRecipesFunction);

    export { db, findRecipesFunction };
    