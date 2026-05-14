import { 
  SafeAreaView, 
  StatusBar, 
  useColorScheme, 
  ActivityIndicator, 
  PermissionsAndroid, 
  Platform, 
  BackHandler, 
  Alert, 
  Linking, 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
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
  const [isCheckingInitialNotification, setIsCheckingInitialNotification] = useState(true);

  // 업데이트 알림 관련 상태
  const CURRENT_VERSION_CODE = 21; // 현재 앱의 버전 코드
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState<any>(null);

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

  // 앱 버전 체크 로직
  const checkAppVersion = async () => {
    try {
      // 운영 환경과 로컬 환경에 따른 API 주소 설정
      const API_BASE_URL = __DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080') : 'https://api.bandicon.kr';
      const response = await fetch(`${API_BASE_URL}/api/common/app-version`);
      if (response.ok) {
        const data = await response.json();
        setLatestVersionInfo(data);
        if (data.latestVersionCode > CURRENT_VERSION_CODE) {
          console.log('Update available! Current:', CURRENT_VERSION_CODE, 'Latest:', data.latestVersionCode);
          setShowUpdateModal(true);
        }
      }
    } catch (error) {
      console.warn('App version check failed:', error);
    }
  };

  useEffect(() => {
    const setupMessaging = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getAndSetFcmToken();
      }

      // 버전 체크 실행
      await checkAppVersion();

      // 1. 앱이 백그라운드 상태일 때 알림 클릭 처리
      const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background:', remoteMessage);
        handleDeepLink(remoteMessage);
      });

      // 2. 토큰 갱신 시 처리
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM Token Refreshed:', token);
        setFcmToken(token);
        sendTokenToWebView(token);
      });

      // 3. 포그라운드 메시지 수신 핸들러 (웹뷰 내부 토스트용)
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('Foreground message received:', remoteMessage);
        sendPushToWebView(remoteMessage);
      });

      // 4. 초기 알림 확인 (앱이 완전히 종료된 상태에서 실행될 때)
      try {
        const initialMessage = await messaging().getInitialNotification();
        if (initialMessage) {
          console.log('Notification caused app to open from quit state (initial):', initialMessage);
          if (initialMessage.data?.click_action) {
            const link = initialMessage.data.click_action;
            const targetUrl = link.startsWith('http') ? link : `${WEB_URL}${link}`;
            console.log('Setting initial URL from deep link:', targetUrl);
            setCurrentUrl(targetUrl);
          }
        }
      } catch (error) {
        console.error('Error checking initial notification:', error);
      } finally {
        setIsCheckingInitialNotification(false);
      }

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

  if (isCheckingInitialNotification) {
    return (
      <SafeAreaView style={{ ...backgroundStyle, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00BDF8" size="large" />
      </SafeAreaView>
    );
  }

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
      
      {/* 업데이트 알림 모달 */}
      <Modal
        visible={showUpdateModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>새로운 버전 출시!</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                더 나은 서비스를 위해 최신 버전({latestVersionInfo?.latestVersionName})으로 업데이트해 주세요.
              </Text>
              <Text style={styles.modalSubDescription}>
                안정적인 앱 사용을 위해 업데이트를 권장합니다.
              </Text>
            </View>
            <View style={styles.modalFooter}>
              {!latestVersionInfo?.forceUpdate && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowUpdateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>나중에</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.updateButton} 
                onPress={() => {
                  const url = Platform.OS === 'ios' 
                    ? (latestVersionInfo?.iosStoreUrl || 'itms-apps://itunes.apple.com/app/id6475653554')
                    : (latestVersionInfo?.storeUrl || 'market://details?id=com.bandimobile');
                    
                  Linking.openURL(url).catch(err => {
                    console.error('Failed to open store URL:', err);
                    Alert.alert('오류', '스토어를 열 수 없습니다.');
                  });
                }}
              >
                <Text style={styles.updateButtonText}>업데이트 하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003C48',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  modalSubDescription: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  updateButtonText: {
    fontSize: 16,
    color: '#00BDF8',
    fontWeight: 'bold',
  },
});

export default App;

