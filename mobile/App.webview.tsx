import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, BackHandler, Platform, Text, Pressable, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import Constants from 'expo-constants';

const WebViewComponent = WebView as any;

const getWebAppUrl = () => {
  // Only EXPO_PUBLIC_* variables are inlined into the app bundle; a plain
  // EXPO_WEB_APP_URL is undefined on the device and was silently ignored.
  const configured = process.env.EXPO_PUBLIC_WEB_APP_URL || process.env.EXPO_WEB_APP_URL;
  if (configured) {
    return configured;
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
const WEB_APP_ORIGIN = new URL(WEB_APP_URL).origin;

/**
 * Only FinFlow itself loads inside the app. Any other site (a link in a
 * narration, a chat answer, a help page) opens in the system browser, where
 * the user can see the address bar.
 */
function isAppUrl(url: string): boolean {
  if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true;
  try {
    return new URL(url).origin === WEB_APP_ORIGIN;
  } catch {
    return false;
  }
}

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
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <WebViewComponent
            ref={webViewRef}
            source={{ uri: WEB_APP_URL }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={(request: { url: string }) => {
              if (isAppUrl(request.url)) return true;
              Linking.openURL(request.url).catch(() => {});
              return false;
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            )}
            renderError={() => (
              <View style={styles.loaderContainer}>
                <Text style={styles.errorTitle}>Can't reach FinFlow</Text>
                <Text style={styles.errorText}>Check your internet connection and try again.</Text>
                <Pressable style={styles.retryButton} onPress={() => webViewRef.current?.reload()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            sharedCookiesEnabled={true}
            applicationNameForUserAgent="FinFlowMobileWebView"
            originWhitelist={['https://*', 'http://*', 'about:*', 'data:*', 'blob:*']}
          />
        </SafeAreaView>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
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
    padding: 24,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
