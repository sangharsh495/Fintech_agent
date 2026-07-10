import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native"
import { useRouter } from "expo-router"
import { login } from "../../lib/auth"
import { useAuth } from "../_layout"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Spacing, Typography, Colors, BorderRadius, Shadows, ComponentSizes, Animation, Interaction } from "../../lib/design-system"
import * as Haptics from "expo-haptics"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [anim] = useState(new Animated.Value(0))
  const router = useRouter()
  const { setAuth } = useAuth()

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: Animation.duration.slower,
        easing: Easing.out(Animation.easing.spring),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    let hasError = false
    if (!email.trim()) {
      setEmailError(true)
      hasError = true
    }
    if (!password) {
      setPasswordError(true)
      hasError = true
    }
    if (hasError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const user = await login(email.trim().toLowerCase(), password)
      const { getToken } = await import("../../lib/auth")
      const token = await getToken()
      setAuth(user, token)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert("Login Failed", error.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Brand */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <LinearGradient colors={Colors.gradients.primary} style={styles.logoGradient}>
            <Ionicons name="wallet-outline" size={48} color={Colors.onPrimary} />
          </LinearGradient>
          <Text style={styles.logoText}>Legend</Text>
          <Text style={styles.logoSubtitle}>Financial Manager</Text>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.welcomeContainer,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>
            Sign in to continue managing your finances
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              emailError && styles.inputWrapperError,
            ]}>
              <Ionicons
                name="mail-outline"
                size={Typography.fontSize.bodyMd}
                color={emailError ? Colors.error : Colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (emailError) setEmailError(false)
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={() => {
                  if (!email.trim()) setEmailError(true)
                }}
              />
            </View>
            {emailError && (
              <Text style={styles.errorText}>Email is required</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputWrapper,
              passwordError && styles.inputWrapperError,
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={Typography.fontSize.bodyMd}
                color={passwordError ? Colors.error : Colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (passwordError) setPasswordError(false)
                }}
                secureTextEntry
                autoComplete="password"
                onBlur={() => {
                  if (!password) setPasswordError(true)
                }}
              />
            </View>
            {passwordError && (
              <Text style={styles.errorText}>Password is required</Text>
            )}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonLoading,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimary} size="large" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              Haptics.selectionAsync()
              router.push("/(auth)/register")
            }}
          >
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xl + 40,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  logoText: {
    fontSize: Typography.fontSize.h2,
    color: Colors.textPrimary,
    fontWeight: "800",
    fontFamily: Typography.fontFamilies.extrabold,
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamilies.medium,
  },

  // Welcome
  welcomeContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: Typography.fontSize.h3,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamilies.regular,
    textAlign: "center",
  },

  // Form
  form: {
    gap: Spacing.md,
  },
  fieldContainer: {
    gap: Spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: Typography.fontSize.labelSm,
    color: Colors.textSecondary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    minHeight: ComponentSizes.input.md,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamilies.regular,
    paddingVertical: Spacing.sm,
    minHeight: ComponentSizes.input.md,
  },
  errorText: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.error,
    fontFamily: Typography.fontFamilies.regular,
    marginLeft: Spacing.xs,
  },
  forgotButton: {
    padding: Spacing.xs,
  },
  forgotText: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },

  // Button
  button: {
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    minHeight: ComponentSizes.button.md,
    ...Shadows.primarySm,
    backgroundColor: Colors.primary,
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

  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontFamilies.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    whiteSpace: "nowrap",
  },

  // Social
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },

  // Link
  linkButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  linkText: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamilies.regular,
  },
  linkHighlight: {
    color: Colors.primary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },
})

import { useEffect } from "react"