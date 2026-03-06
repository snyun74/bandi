import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDndAWjrrYG_d1d7JP9Z-_gG_SJ0IARt_c",
    authDomain: "bandi-push.firebaseapp.com",
    projectId: "bandi-push",
    storageBucket: "bandi-push.firebasestorage.app",
    messagingSenderId: "1096492690761",
    appId: "1:1096492690761:web:9d4fa8b14260368b763e98",
    measurementId: "G-9829Z159ST"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const VAPID_KEY = "BGjs4N5Qy2XYZAjwG01pcn4WuGReb3zehV9nknD7r3AaOR9WzoeTl7yepSjqHHmsPy21jbjVgpJwbzc3aoyStp0";
