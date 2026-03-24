import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const [fileUri, setFileUri] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    prepareApp();
  }, []);

  async function prepareApp() {
    try {
      // Set Android nav bar
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync('#050b14');
        await NavigationBar.setButtonStyleAsync('light');
      }

      // Request notification permissions
      await Notifications.requestPermissionsAsync();

      // Copy HTML asset to a readable file URI
      const asset = Asset.fromModule(require('./assets/app.html'));
      await asset.downloadAsync();
      const dest = FileSystem.documentDirectory + 'must_connect_app.html';
      await FileSystem.copyAsync({ from: asset.localUri, to: dest });
      setFileUri(dest);
    } catch (err) {
      console.error('Prep error:', err);
      // Fallback
      try {
        const asset = Asset.fromModule(require('./assets/app.html'));
        await asset.downloadAsync();
        setFileUri(asset.localUri);
      } catch (e) {
        setLoadError(true);
        await SplashScreen.hideAsync();
      }
    }
  }

  const onLoad = useCallback(async () => {
    setAppReady(true);
    await SplashScreen.hideAsync();
  }, []);

  // Android hardware back button — navigate inside WebView
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, []);

  // Handle messages from WebView (e.g. image upload requests)
  async function onMessage(event) {
    const data = event.nativeEvent.data;
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'PICK_IMAGE') {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          injectJS(`window.mustImagePickerCallback && window.mustImagePickerCallback(null, 'Permission denied')`);
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!result.canceled && result.assets[0]) {
          const b64 = 'data:image/jpeg;base64,' + result.assets[0].base64;
          injectJS(`window.mustImagePickerCallback && window.mustImagePickerCallback('${b64}', null)`);
        } else {
          injectJS(`window.mustImagePickerCallback && window.mustImagePickerCallback(null, 'Cancelled')`);
        }
      }
    } catch (e) {
      // Not JSON — ignore
    }
  }

  function injectJS(code) {
    webViewRef.current?.injectJavaScript(code + '; true;');
  }

  // Injected JS: fix viewport height + enable native image picker bridge
  const INJECTED_JS = `
    (function() {
      // Fix 100dvh for WebView
      function setVH() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
        var style = document.getElementById('__vh_fix');
        if (!style) {
          style = document.createElement('style');
          style.id = '__vh_fix';
          document.head.appendChild(style);
        }
        style.textContent =
          '#app { height: ' + window.innerHeight + 'px !important; max-height: ' + window.innerHeight + 'px !important; }' +
          'html, body { height: ' + window.innerHeight + 'px !important; overflow: hidden !important; }';
      }
      setVH();
      window.addEventListener('resize', setVH);

      // Native image picker bridge
      // Override file input clicks to use native picker on mobile
      document.addEventListener('click', function(e) {
        var el = e.target;
        if (el.tagName === 'INPUT' && el.type === 'file' && el.accept && el.accept.includes('image')) {
          e.preventDefault();
          e.stopPropagation();
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PICK_IMAGE', inputId: el.id }));
          // Store reference so callback can set value
          window.__pendingFileInput = el;
        }
      }, true);

      // Callback: receives base64 from native
      window.mustImagePickerCallback = function(base64, err) {
        if (err || !base64) return;
        var inp = window.__pendingFileInput;
        if (!inp) return;
        // Simulate file input change with base64 data
        // Call the onchange handler with the base64 data directly
        var id = inp.id;
        if (id === 'su-file') {
          if (typeof previewPhoto === 'function') {
            // Inject the photo directly
            window.signupDraft = window.signupDraft || {};
            window.signupDraft.photo = base64;
            var prev = document.getElementById('su-preview');
            var icon = document.querySelector('#su-circle svg');
            if (prev) { prev.src = base64; prev.style.display = 'block'; }
            if (icon) icon.style.display = 'none';
            var photoErr = document.getElementById('photo-err');
            if (photoErr) photoErr.style.display = 'none';
          }
        } else if (id === 'ep-photo') {
          var epPrev = document.getElementById('ep-photo-preview');
          var epIcon = document.getElementById('ep-cam-icon');
          if (epPrev) { epPrev.src = base64; epPrev.style.display = 'block'; }
          if (epIcon) epIcon.style.display = 'none';
          if (window.currentProfile) window.currentProfile.photo = base64;
        } else if (id === 'np-photo') {
          window.npPhotoData = base64;
          var lbl = document.getElementById('np-photo-lbl');
          if (lbl) lbl.textContent = '📷 Photo added';
        } else if (id === 'su-file') {
          if (window.signupDraft) window.signupDraft.photo = base64;
        }
      };

      true;
    })();
  `;

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load MUST Connect</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={prepareApp}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#050b14" translucent={false}/>
      {!appReady && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E8A020"/>
          <Text style={styles.loaderText}>Loading MUST Connect…</Text>
        </View>
      )}
      {fileUri && (
        <WebView
          ref={webViewRef}
          source={{ uri: fileUri }}
          style={[styles.webview, !appReady && styles.hidden]}
          onLoad={onLoad}
          onMessage={onMessage}
          injectedJavaScript={INJECTED_JS}
          injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          originWhitelist={['*']}
          geolocationEnabled={false}
          cacheEnabled={true}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          contentInset={{ top: 0, bottom: 0 }}
          onError={e => console.warn('WebView error:', e.nativeEvent)}
          onHttpError={e => console.warn('HTTP error:', e.nativeEvent)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b14',
  },
  webview: {
    flex: 1,
    backgroundColor: '#050b14',
  },
  hidden: {
    opacity: 0,
    position: 'absolute',
    width: 0,
    height: 0,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050b14',
    gap: 16,
  },
  loaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'System',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050b14',
    gap: 16,
    padding: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#1B4F8A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 40,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
