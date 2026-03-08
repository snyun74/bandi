importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDndAWjrrYG_d1d7JP9Z-_gG_SJ0IARt_c",
    authDomain: "bandi-push.firebaseapp.com",
    projectId: "bandi-push",
    storageBucket: "bandi-push.firebasestorage.app",
    messagingSenderId: "1096492690761",
    appId: "1:1096492690761:web:9d4fa8b14260368b763e98",
    measurementId: "G-9829Z159ST"
});

const messaging = firebase.messaging();

// 설치 즉시 활성화되도록 설정
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // 배경에서 알림이 명시적으로 오지 않을 경우 여기서 직접 띄울 수 있지만, 
    // 보통 백엔드에서 notification 객체로 보낼 경우 브라우저가 자동으로 띄웁니다.
});

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked');
    event.notification.close();

    const data = event.notification.data || {};
    // URL이 없으면 기본적으로 메인('/')으로 이동하도록 함
    const clickAction = data.click_action || '/';
    const urlToOpen = new URL(clickAction, self.location.origin).href;
    const logNo = data.logNo;

    const promiseChain = Promise.all([
        // 읽음 처리 알림 (비동기)
        logNo ? fetch(new URL(`/api/push/read/${logNo}`, self.location.origin).href, { method: 'POST' }).catch(() => { }) : Promise.resolve(),

        // 창 열기 로직
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // 1. 이미 열려 있는 탭이 있다면 그 탭을 찾아서 이동 및 포커스
            for (const client of windowClients) {
                if ('focus' in client && 'navigate' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // 2. 열려 있는 탭이 없으면 새로 열기
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    ]);

    event.waitUntil(promiseChain);
});
