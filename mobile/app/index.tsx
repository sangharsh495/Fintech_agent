import { Redirect } from "expo-router"

export default function Index() {
  // Expo Router requires a root "/" route mapping to index.tsx.
  // The layout will automatically redirect to the dashboard if the user is authenticated.
  return <Redirect href="/(auth)/login" />
}
