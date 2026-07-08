import { useEffect, useState } from "react"
import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View, ActivityIndicator, StyleSheet } from "react-native"
import { checkAuth, AuthUser } from "../lib/auth"
import { createContext, useContext } from "react"

// ─── Auth Context ────────────────────────────────────────────

type AuthContextType = {
  user: AuthUser | null
  token: string | null
  setAuth: (user: AuthUser | null, token: string | null) => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setAuth: () => {},
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

// ─── Root Layout ─────────────────────────────────────────────

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  const setAuth = (newUser: AuthUser | null, newToken: string | null) => {
    setUser(newUser)
    setToken(newToken)
  }

  // Check for existing auth on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const auth = await checkAuth()
        if (auth) {
          setUser(auth.user)
          setToken(auth.token)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [])

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!user && !inAuthGroup) {
      // Not logged in and not on auth screen → redirect to login
      router.replace("/(auth)/login")
    } else if (user && inAuthGroup) {
      // Logged in but on auth screen → redirect to dashboard
      router.replace("/(tabs)/dashboard")
    }
  }, [user, segments, isLoading])

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <StatusBar style="light" />
      </View>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, isLoading }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#0f172a" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </AuthContext.Provider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },
})
