import { useState, useRef, useEffect } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { verifyOtp, resendOtp } from "../../lib/auth"

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputs = useRef<(TextInput | null)[]>([])
  const router = useRouter()

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendTimer])

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = text
    setOtp(newOtp)
    if (text && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code")
      return
    }

    setLoading(true)
    try {
      const success = await verifyOtp(email!, code)
      if (success) {
        Alert.alert("Success", "Email verified! You can now login.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ])
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid or expired OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendOtp(email!)
      setResendTimer(60)
      Alert.alert("OTP Sent", "A new verification code has been sent to your email")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>✉️</Text>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
              value={digit}
              onChangeText={(text) => handleChange(text.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendTimer > 0}
        >
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, color: "#f8fafc", fontWeight: "800" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 8, textAlign: "center", lineHeight: 20 },
  email: { color: "#6366f1", fontWeight: "600" },
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 },
  otpInput: {
    width: 48, height: 56, backgroundColor: "#1e293b", borderRadius: 12, textAlign: "center",
    fontSize: 24, fontWeight: "700", color: "#f8fafc", borderWidth: 2, borderColor: "#334155",
  },
  otpInputFilled: { borderColor: "#6366f1" },
  button: { backgroundColor: "#6366f1", borderRadius: 12, padding: 16, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendButton: { alignItems: "center", marginTop: 20 },
  resendText: { color: "#6366f1", fontSize: 14, fontWeight: "600" },
  resendDisabled: { color: "#64748b" },
})
