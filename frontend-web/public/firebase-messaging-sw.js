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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // 참고: 백엔드에서 'notification' 페이로드를 포함해 보내면 브라우저가 자동으로 알림을 띄웁니다.
    // 여기서 showNotification을 또 호출하면 중복된 알림이 발생하므로 주석 처리하거나 로깅용으로만 사용합니다.
    /*
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/bandicon.png',
        data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
    */
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data;
    const urlToOpen = data?.click_action || '/';
    const logNo = data?.logNo;

    const promiseChain = Promise.all([
        // 읽음 처리 API 호출
        logNo ? fetch(`/api/push/read/${logNo}`, { method: 'POST' }).catch(err => console.error('Read API fail:', err)) : Promise.resolve(),
        // 창 열기/포커스
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    ]);

    event.waitUntil(promiseChain);
});
