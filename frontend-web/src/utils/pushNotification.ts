import { messaging, VAPID_KEY } from "../firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

export const requestPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                console.log("FCM Token:", token);
                saveTokenToServer(token);
            }
        }
    } catch (error) {
        console.error("Error requesting permission:", error);
    }
};

const saveTokenToServer = async (token: string) => {
    const userId = localStorage.getItem("userId");
    console.log("Attempting to save token for user:", userId);

    if (!userId) {
        console.warn("No userId found in localStorage. Token not saved.");
        return;
    }

    try {
        console.log("Sending token to server...");
        const response = await fetch("/api/push/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId,
                token,
                deviceType: "WEB",
            }),
        });

        if (response.ok) {
            console.log("Token saved successfully to server.");
        } else {
            console.error("Failed to save token to server. Status:", response.status);
        }
    } catch (error) {
        console.error("Error saving token to server:", error);
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
