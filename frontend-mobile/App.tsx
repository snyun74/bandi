import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from 'react-native/Libraries/NewAppScreen';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  // __DEV__ 는 React Native가 로컬에서 실행될 때(디버그) true, 빌드되어 배포될 때(릴리즈) false가 되는 내장 변수입니다.
  const LOCAL_WEB_URL = 'http://192.168.20.23:5173';
  const PROD_WEB_URL = 'https://bandicon.duckdns.org';

  const WEB_URL = __DEV__ ? LOCAL_WEB_URL : PROD_WEB_URL;

  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <WebView
        source={{ uri: WEB_URL }}
        style={{ flex: 1 }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
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
