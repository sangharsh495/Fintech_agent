import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { verifyOtp, resendOtp } from "../../lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { Spacing, Typography, Colors, BorderRadius, Shadows, ComponentSizes, Animation } from "../../lib/design-system"
import * as Haptics from "expo-haptics"

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [mounted, setMounted] = useState(false)
  const [anim] = useState(new Animated.Value(0))
  const inputs = useRef<(TextInput | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    Animated.timing(anim, {
      toValue: 1,
      duration: Animation.duration.slower,
      easing: Easing.out(Animation.easing.spring),
      useNativeDriver: true,
    }).start()
  }, [])

  // Countdown for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendTimer])

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = text.slice(-1)
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const success = await verifyOtp(email!, code)
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert("Success", "Email verified! You can now login.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ])
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert("Verification Failed", error.message || "Invalid or expired OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await resendOtp(email!)
      setResendTimer(60)
      Alert.alert("OTP Sent", "A new verification code has been sent to your email")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP")
    }
  }

  if (!mounted) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const fadeIn = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })
  const slideUp = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
      ]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { ...Shadows.primary }]}>
            <Ionicons name="mail-outline" size={32} color={Colors.onPrimary} />
          </View>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.otpInputWrapper}>
              <TextInput
                ref={(ref) => { inputs.current[index] = ref }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : styles.otpInputEmpty,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text.slice(-1), index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
                fontFamily={Typography.fontFamilies.bold}
              />
            </View>
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonLoading, { ...Shadows.primary }]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onPrimary} size="large" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendTimer > 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.resendText,
              resendTimer > 0 && styles.resendDisabled,
            ]}
          >
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
          </Text>
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Didn&apos;t receive the code? Check your spam folder or request a new one.
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: Typography.fontSize.h3,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: Typography.fontFamilies.regular,
  },
  email: {
    color: Colors.primary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },

  // OTP Inputs
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpInputWrapper: {
    ...Shadows.sm,
  },
  otpInput: {
    width: 52,
    height: 60,
    borderRadius: BorderRadius.card,
    textAlign: "center",
    fontSize: Typography.fontSize.numericMd,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamilies.bold,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  otpInputEmpty: {
    borderColor: Colors.border,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },

  // Button
  button: {
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: ComponentSizes.button.md,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  buttonLoading: {
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.onPrimary,
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },

  // Resend
  resendButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  resendText: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  resendDisabled: {
    color: Colors.textTertiary,
  },

  // Help
  helpText: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.textTertiary,
    textAlign: "center",
    fontFamily: Typography.fontFamilies.regular,
    lineHeight: 20,
  },
})