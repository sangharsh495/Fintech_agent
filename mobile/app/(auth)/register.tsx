import { useState, useEffect } from "react"
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
import { register } from "../../lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { Spacing, Typography, Colors, BorderRadius, Shadows, ComponentSizes, Animation } from "../../lib/design-system"
import * as Haptics from "expo-haptics"

export default function RegisterScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [anim] = useState(new Animated.Value(0))
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const result = await register(name, email.trim().toLowerCase(), password)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert("Success", result.message)
      router.push({ pathname: "/(auth)/verify-otp", params: { email: email.trim().toLowerCase() } })
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert("Registration Failed", error.message || "Could not create account")
    } finally {
      setLoading(false)
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Spacing.md}
    >
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoGradient, { ...Shadows.primary }]}>
              <Text style={styles.logoText}>L</Text>
            </View>
            <Text style={styles.logoSubtitle}>Legend Financial</Text>
          </View>

          {/* Welcome */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>Start managing your finances today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, { ...Shadows.sm }]}>
                <Ionicons name="person-outline" size={22} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={Colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  autoCapitalize="words"
                  fontFamily={Typography.fontFamilies.regular}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, { ...Shadows.sm }]}>
                <Ionicons name="mail-outline" size={22} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  fontFamily={Typography.fontFamilies.regular}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Password</Text>
              </View>
              <View style={[styles.inputWrapper, { ...Shadows.sm }]}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  fontFamily={Typography.fontFamilies.regular}
                />
              </View>
              <Text style={styles.passwordHint}>
                Use 8+ chars with uppercase & number
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { ...Shadows.sm }]}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  fontFamily={Typography.fontFamilies.regular}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonLoading,
                { ...Shadows.primary },
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} size="large" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
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
                style={[styles.socialButton, { ...Shadows.sm }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, { ...Shadows.sm }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                Haptics.selectionAsync()
                router.back()
              }}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xl + 40,
  },
  content: {
    width: "100%",
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
    backgroundColor: Colors.primary,
  },
  logoText: {
    fontSize: Typography.fontSize.h1,
    color: Colors.onPrimary,
    fontWeight: "800",
    fontFamily: Typography.fontFamilies.extrabold,
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
    minHeight: ComponentSizes.input.md,
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
  passwordHint: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontFamilies.regular,
    marginLeft: Spacing.xs,
  },

  // Button
  button: {
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    minHeight: ComponentSizes.button.md,
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