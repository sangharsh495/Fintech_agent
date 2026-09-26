// FinFlow Mobile Unified Web-Native App Entry Point
// Connects Android APK directly to FinFlow Cloud Vault with 100% web parity,
// shared session authentication, hardware back navigation, and live synchronization.
import { registerRootComponent } from 'expo';
import App from './App.webview';

registerRootComponent(App);
