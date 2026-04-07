import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAnalytics, isSupported } from "firebase/analytics";

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

// Analytics 및 Messaging은 특정 환경(HTTPS/Service Worker 지원 등)에서만 동작함
// 초기값을 null로 설정하고 지원 여부를 확인하여 할당
export let analytics: any = null;
export let messaging: any = null;

// 지원 여부 확인 후 조용히 할당 (에러 발생 시 무시)
if (typeof window !== 'undefined') {
    isSupported().then(supported => {
        if (supported) analytics = getAnalytics(app);
    }).catch(() => {});

    import("firebase/messaging").then(({ isSupported: isMsgSupported, getMessaging: getMsg }) => {
        isMsgSupported().then(supported => {
            if (supported) messaging = getMsg(app);
        }).catch(() => {});
    }).catch(() => {});
}

export const VAPID_KEY = "BGjs4N5Qy2XYZAjwG01pcn4WuGReb3zehV9nknD7r3AaOR9WzoeTl7yepSjqHHmsPy21jbjVgpJwbzc3aoyStp0";




