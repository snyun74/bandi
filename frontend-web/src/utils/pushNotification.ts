import { messaging, VAPID_KEY } from "../firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";

/**
 * 앱 환경(Android / iOS WebView)인지 확인
 */
export const isAppEnvironment = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).__appVersionCode ||
        navigator.userAgent.includes('BandiconApp') ||
        navigator.userAgent.includes('BandiMobile');
};

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
                await saveTokenToServer(token, "WEB");
            }
        }

        // 앱(APP)에서 전달받아 보관 중인 토큰이 있다면 함께 저장
        const cachedToken = localStorage.getItem("cached_fcm_token") || (window as any).__pendingSaveToken?.token;
        const cachedDevice = localStorage.getItem("cached_device_type") || (window as any).__pendingSaveToken?.deviceType || (isAppEnvironment() ? "APP" : "WEB");
        if (cachedToken) {
            await saveTokenToServer(cachedToken, cachedDevice);
            delete (window as any).__pendingSaveToken;
        }
    } catch (error) {
        console.error("Error requesting permission:", error);
    }
};

/**
 * 디바이스 토큰 서버 저장 (중복 등록 스킵 및 로컬 캐싱 적용)
 */
export const saveTokenToServer = async (
    token: string,
    deviceType: "WEB" | "ANDROID" | "IOS" | "APP" | string = "WEB"
): Promise<boolean> => {
    if (!token) return false;

    // 1. 토큰 및 디바이스 타입을 로컬스토리지에 보존 (페이지 이동 및 리로드 유실 방지)
    localStorage.setItem("cached_fcm_token", token);
    localStorage.setItem("cached_device_type", deviceType);

    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.warn(`No userId found in localStorage. Storing ${deviceType} token as pending.`);
        (window as any).__pendingSaveToken = { token, deviceType };
        return false;
    }

    // 2. 이미 해당 유저에게 동일한 토큰으로 등록 완료되었는지 체크 (중복 서버 호출 스킵 및 부하 방지)
    const lastSyncedToken = localStorage.getItem("last_synced_fcm_token");
    const lastSyncedUser = localStorage.getItem("last_synced_user_id");

    if (lastSyncedToken === token && lastSyncedUser === userId) {
        console.log(`[Push] Device token already registered on server for user: ${userId}. Skipping server call.`);
        return true;
    }

    // 3. 등록되지 않았거나 변경된 경우에만 서버 API 호출
    try {
        console.log(`[Push] Registering ${deviceType} token to server for user: ${userId}`);
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
            console.log(`[Push] ${deviceType} Token successfully registered to server.`);
            localStorage.setItem("last_synced_fcm_token", token);
            localStorage.setItem("last_synced_user_id", userId);
            delete (window as any).__pendingSaveToken;
            return true;
        } else {
            console.error(`[Push] Failed to register token to server. Status:`, response.status);
            return false;
        }
    } catch (error) {
        console.error(`[Push] Error registering ${deviceType} token to server:`, error);
        return false;
    }
};

/**
 * 보관된 토큰을 현재 로그인한 유저로 서버에 동기화
 */
export const syncDeviceToken = async (): Promise<boolean> => {
    const userId = localStorage.getItem("userId");
    if (!userId) return false;

    const token = localStorage.getItem("cached_fcm_token") || (window as any).__pendingSaveToken?.token;
    const deviceType = localStorage.getItem("cached_device_type") || (window as any).__pendingSaveToken?.deviceType || (isAppEnvironment() ? "APP" : "WEB");

    if (!token) return false;

    return await saveTokenToServer(token, deviceType);
};

/**
 * 장비가 현재 유저로 이미 등록되어 있는지 확인
 */
export const isDeviceRegistered = (): boolean => {
    const userId = localStorage.getItem("userId");
    if (!userId) return false;

    const lastSyncedUser = localStorage.getItem("last_synced_user_id");
    const lastSyncedToken = localStorage.getItem("last_synced_fcm_token");
    const cachedToken = localStorage.getItem("cached_fcm_token");

    if (!lastSyncedToken || lastSyncedUser !== userId) {
        return false;
    }

    if (cachedToken && cachedToken !== lastSyncedToken) {
        return false;
    }

    return true;
};

export const onMessageListener = (callback: (payload: any) => void) => {
    if (!messaging) return null;
    return onMessage(messaging, (payload) => {
        callback(payload);
    });
};
