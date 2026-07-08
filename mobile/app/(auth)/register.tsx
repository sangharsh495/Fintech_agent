import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { register } from "../../lib/auth"

export default function RegisterScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const result = await register(name, email.trim().toLowerCase(), password)
      Alert.alert("Success", result.message)
      router.push({ pathname: "/(auth)/verify-otp", params: { email: email.trim().toLowerCase() } })
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Could not create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logoIcon}>₹</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start managing your finances</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { flexGrow: 1, justifyContent: "center" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: "center", marginBottom: 36 },
  logoIcon: { fontSize: 40, color: "#6366f1", fontWeight: "800", marginBottom: 8 },
  title: { fontSize: 28, color: "#f8fafc", fontWeight: "800" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  form: { gap: 8 },
  label: { fontSize: 14, color: "#94a3b8", fontWeight: "600", marginTop: 8 },
  input: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, fontSize: 16, color: "#f8fafc", borderWidth: 1, borderColor: "#334155" },
  button: { backgroundColor: "#6366f1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { alignItems: "center", marginTop: 16 },
  linkText: { color: "#94a3b8", fontSize: 14 },
  linkHighlight: { color: "#6366f1", fontWeight: "600" },
})
