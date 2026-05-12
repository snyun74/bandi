import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StatusBar, useColorScheme, ActivityIndicator, PermissionsAndroid, Platform, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import messaging from '@react-native-firebase/messaging';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const webViewRef = useRef<WebView>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const LOCAL_WEB_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5173' : 'http://localhost:5173';
  const PROD_WEB_URL = 'https://www.bandicon.kr';
  const WEB_URL = __DEV__ ? LOCAL_WEB_URL : PROD_WEB_URL;

  const [currentUrl, setCurrentUrl] = useState(WEB_URL);
  const [isLoading, setIsLoading] = useState(true);

  // 알림 권한 요청 (iOS 및 Android 13+)
  const requestUserPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  };

  // FCM 토큰 획득 및 설정
  const getAndSetFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      if (token) {
        console.log('Firebase Token:', token);
        setFcmToken(token);
      }
    } catch (error) {
      console.warn('FCM Token error:', error);
    }
  };

  // 웹뷰로 토큰 전달 (인위적 주입)
  const sendTokenToWebView = (token: string) => {
    if (webViewRef.current && token) {
      const script = `
        if (window.receiveFcmToken) {
          window.receiveFcmToken("${token}");
        } else {
          console.log("window.receiveFcmToken not found yet");
          window.__pendingFcmToken = "${token}";
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // 웹뷰로 푸시 알림 데이터 전달 (포그라운드용)
  const sendPushToWebView = (remoteMessage: any) => {
    if (webViewRef.current && remoteMessage) {
      const payloadString = JSON.stringify(remoteMessage);
      const script = `
        if (window.receiveNativeMessage) {
          window.receiveNativeMessage('${payloadString}');
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // 알림 클릭 시 특정 페이지로 이동 처리 (백그라운드/종료 상태용)
  const handleDeepLink = (remoteMessage: any) => {
    if (remoteMessage?.data?.click_action) {
      const link = remoteMessage.data.click_action;
      const targetUrl = link.startsWith('http') ? link : `${WEB_URL}${link}`;
      console.log('Navigating to deep link:', targetUrl);
      
      if (webViewRef.current) {
        const script = `window.location.href = "${targetUrl}"; true;`;
        webViewRef.current.injectJavaScript(script);
      } else {
        // 웹뷰가 아직 준비되지 않은 경우 초기 URL 변경
        setCurrentUrl(targetUrl);
      }
    }
  };

  useEffect(() => {
    const setupMessaging = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getAndSetFcmToken();
      }

      // 1. 앱이 백그라운드 상태일 때 알림 클릭 처리
      const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background:', remoteMessage);
        handleDeepLink(remoteMessage);
      });

      // 2. 앱이 완전히 종료된 상태일 때 알림 클릭 처리
      messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          handleDeepLink(remoteMessage);
        }
      });

      // 3. 토큰 갱신 시 처리
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM Token Refreshed:', token);
        setFcmToken(token);
        sendTokenToWebView(token);
      });

      // 4. 포그라운드 메시지 수신 핸들러 (웹뷰 내부 토스트용)
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('Foreground message received:', remoteMessage);
        sendPushToWebView(remoteMessage);
      });

      return () => {
        unsubscribeOnNotificationOpenedApp();
        unsubscribeTokenRefresh();
        unsubscribeOnMessage();
      };
    };

    setupMessaging();

    // 안드로이드 하드웨어 뒤로가기 버튼 처리
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // 기본 동작(앱 종료) 방지
      }
      return false; // 기본 동작(앱 종료) 수행
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={{ flex: 1 }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          if (fcmToken) {
            sendTokenToWebView(fcmToken);
          }
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#00BDF8"
            size="large"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -25 }, { translateY: -25 }] }}
          />
        )}
      />
    </SafeAreaView>
  );
}

export default App;

