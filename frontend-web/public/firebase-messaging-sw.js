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
    const logNo = data.logNo;

    // 1. 읽음 처리 (백그라운드 비동기 실행)
    if (logNo) {
        const readUrl = new URL(`/api/push/read/${logNo}`, self.location.origin).href;
        event.waitUntil(fetch(readUrl, { method: 'POST' }).catch(() => { }));
    }

    // 2. 페이지 이동 로직
    // 백엔드에서 WebpushConfig.fcm_options.link 를 설정했으므로 브라우저가 기본적으로 처리함.
    // 만약 브라우저가 자동 처리를 하지 않는 환경을 대비해 보조 로직 유지.
    const clickAction = data.click_action || '/';
    const urlToOpen = new URL(clickAction, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
