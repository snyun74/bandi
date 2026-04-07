import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StatusBar, useColorScheme, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import messaging from '@react-native-firebase/messaging';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const webViewRef = useRef<WebView>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const LOCAL_WEB_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5173' : 'http://localhost:5173';
  const PROD_WEB_URL = 'https://www.bandicon.kr';
  const WEB_URL = __DEV__ ? LOCAL_WEB_URL : PROD_WEB_URL;

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

  // 웹뷰로 푸시 알림 데이터 전달
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

  useEffect(() => {
    const setupMessaging = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getAndSetFcmToken();
      }

      // 토큰 갱신 시 처리
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM Token Refreshed:', token);
        setFcmToken(token);
        sendTokenToWebView(token);
      });

      // 포그라운드 메시지 수신 핸들러 (웹뷰로 전달)
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('Foreground message received:', remoteMessage);
        sendPushToWebView(remoteMessage);
      });

      return () => {
        unsubscribeTokenRefresh();
        unsubscribeOnMessage();
      };
    };

    setupMessaging();
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={{ flex: 1 }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          if (fcmToken) {
            sendTokenToWebView(fcmToken);
          }
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
