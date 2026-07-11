import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, BackHandler, Platform, SafeAreaView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Constants from 'expo-constants';

const WebViewComponent = WebView as any;

const getWebAppUrl = () => {
  if (process.env.EXPO_WEB_APP_URL) {
    return process.env.EXPO_WEB_APP_URL;
  }
  
  if (__DEV__) {
    // Attempt to get the local developer machine IP address
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.100:8081"
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    return 'http://192.168.1.100:3000'; // fallback dev IP
  }
  
  return 'https://finflow-app-ashen.vercel.app'; // production URL
};

const WEB_APP_URL = getWebAppUrl();

export default function App() {
  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle Android back button navigation
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
      };
    }
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <WebViewComponent
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          sharedCookiesEnabled={true}
          applicationNameForUserAgent="FinWiseMobileWebView"
          originWhitelist={['*']}
        />
      </SafeAreaView>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});


