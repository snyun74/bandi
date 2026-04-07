import { messaging, VAPID_KEY } from "../firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

export const requestPermission = async () => {
    // 1. 브라우저가 Notification 기능을 지원하는지 확인
    if (!('Notification' in window)) {
        console.warn("This browser does not support notifications.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted" && messaging) {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                console.log("Web FCM Token:", token);
                saveTokenToServer(token, "WEB");
            }
        }

        // 앱(APP)에서 전달받아 보관 중인 토큰이 있다면 함께 저장
        const pending = (window as any).__pendingSaveToken;
        if (pending && pending.token) {
            console.log("Processing pending APP token from memory...");
            saveTokenToServer(pending.token, pending.deviceType);
            delete (window as any).__pendingSaveToken;
        }
    } catch (error) {
        console.error("Error requesting permission:", error);
    }
};

export const saveTokenToServer = async (token: string, deviceType: "WEB" | "APP" = "WEB") => {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
        console.warn(`No userId found in localStorage. Storing ${deviceType} token as pending.`);
        // 로그인이 아직 안 된 경우, 전역 변수에 보관했다가 로그인 후 처리할 수 있게 함
        (window as any).__pendingSaveToken = { token, deviceType };
        return;
    }

    try {
        console.log(`Sending ${deviceType} token to server for user: ${userId}`);
        const response = await fetch("/api/push/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                token,
                deviceType,
            }),
        });

        if (response.ok) {
            console.log(`${deviceType} Token saved successfully to server.`);
        } else {
            console.error(`Failed to save ${deviceType} token to server. Status:`, response.status);
        }
    } catch (error) {
        console.error(`Error saving ${deviceType} token to server:`, error);
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    if (!messaging) return null;
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
