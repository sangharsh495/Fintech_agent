import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  Image,
} from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { useAuth } from "../_layout"
import { uploadApi, banksApi } from "../../lib/api"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Spacing, Typography, Colors, BorderRadius, Shadows, ComponentSizes, Layout, Animation, Interaction, PremiumEffects, DesignSystem } from "../../lib/design-system"
import * as Haptics from "expo-haptics"

export default function UploadScreen() {
  const { token } = useAuth()
  const [banks, setBanks] = useState<any[]>([])
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [file, setFile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [anim] = useState(new Animated.Value(0))

  useEffect(() => {
    if (!token) return
    banksApi.list(token).then((res) => {
      setBanks(res.banks)
      if (res.banks.length > 0) setSelectedBank(res.banks[0].id)
    }).catch(console.error)
    setMounted(true)
  }, [token])

  // Animate on mount
  useEffect(() => {
    if (!mounted) return
    Animated.timing(anim, {
      toValue: 1,
      duration: Animation.duration.slower,
      easing: Easing.out(Animation.easing.spring),
      useNativeDriver: true,
    }).start()
  }, [mounted])

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets?.[0]) {
        setFile(result.assets[0])
        setResult(null)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file")
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedBank || !token) {
      Alert.alert("Error", "Please select a bank and a file")
      return
    }

    setUploading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const formData = new FormData()
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as any)
      formData.append("bankAccountId", selectedBank)

      const uploadResult = await uploadApi.statement(token, formData)
      setResult(uploadResult)
      setFile(null)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert("Upload Failed", error.message || "Could not process the file")
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()
    if (ext === "pdf") return { icon: "file-pdf", color: Colors.error, bg: Colors.error + "15" }
    if (ext === "csv") return { icon: "file-csv", color: Colors.success, bg: Colors.success + "15" }
    if (ext === "xlsx" || ext === "xls") return { icon: "file-excel", color: Colors.warning, bg: Colors.warning + "15" }
    return { icon: "file-outline", color: Colors.primary, bg: Colors.primary + "15" }
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.title}>Upload Statement</Text>
        <Text style={styles.subtitle}>Upload your bank statement (PDF, CSV, or Excel)</Text>
      </Animated.View>

      {/* Bank Selection */}
      <Animated.View
        style={[
          styles.section,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.label}>Select Bank Account</Text>
        {banks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="add-circle-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No bank accounts added yet</Text>
            <Text style={styles.emptySubtext}>Go to Settings to add one</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bankScroll}
            scrollEventThrottle={16}
          >
            {banks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={[
                  styles.bankChip,
                  selectedBank === bank.id && styles.bankChipActive,
                ]}
                onPress={() => {
                  setSelectedBank(bank.id)
                  Haptics.selectionAsync()
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.bankChipText,
                    selectedBank === bank.id && styles.bankChipTextActive,
                  ]}
                >
                  {bank.bankName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* File Picker */}
      <Animated.View
        style={[
          styles.filePickerButton,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
        onPress={pickFile}
        activeOpacity={0.9}
      >
        <View style={styles.filePickerIconWrapper}>
          {file ? (
            <>
              <View
                style={[
                  styles.fileTypeBadge,
                  { backgroundColor: getFileIcon(file.name).bg },
                ]}
              >
                <MaterialCommunityIcons
                  name={getFileIcon(file.name).icon}
                  size={32}
                  color={getFileIcon(file.name).color}
                />
              </View>
            </>
          ) : (
            <Ionicons name="cloud-upload-outline" size={48} color={Colors.textSecondary} />
          )}
        </View>
        <Text style={styles.filePickerText}>
          {file ? file.name : "Tap to select a file"}
        </Text>
        {file && (
          <Text style={styles.fileSize}>
            {(file.size / 1024).toFixed(0)} KB
          </Text>
        )}
      </Animated.View>

      {/* Upload Button */}
      <Animated.View
        style={[
          styles.uploadButton,
          (!file || !selectedBank || uploading) && styles.uploadButtonDisabled,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
        onPress={handleUpload}
        disabled={!file || !selectedBank || uploading}
        activeOpacity={0.9}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload & Process</Text>
        )}
      </Animated.View>

      {/* Result */}
      {result && (
        <Animated.View
          style={[
            styles.resultCard,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.resultIconWrapper}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.resultText}>{result.message}</Text>
          <View style={styles.resultStats}>
            <Text style={styles.resultStat}>Added: {result.transactionsAdded}</Text>
            <Text style={styles.resultStat}>Skipped: {result.transactionsSkipped}</Text>
          </View>
        </Animated.View>
      )}

      {/* Supported Formats */}
      <Animated.View
        style={[
          styles.helpSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.helpTitle}>How to get your bank statement</Text>
        <View style={styles.helpGrid}>
          <View style={styles.helpCard}>
            <View style={[styles.helpIcon, { backgroundColor: Colors.error + "15" }]}>
              <Ionicons name="document-text-outline" size={24} color={Colors.error} />
            </View>
            <Text style={styles.helpCardTitle}>PDF</Text>
            <Text style={styles.helpCardDesc}>
              Download from your bank's internet banking → Statements → Download
            </Text>
          </View>
          <View style={styles.helpCard}>
            <View style={[styles.helpIcon, { backgroundColor: Colors.success + "15" }]}>
              <Ionicons name="document-text-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.helpCardTitle}>Excel</Text>
            <Text style={styles.helpCardDesc}>
              Some banks offer Excel export from transaction history
            </Text>
          </View>
          <View style={styles.helpCard}>
            <View style={[styles.helpIcon, { backgroundColor: Colors.warning + "15" }]}>
              <Ionicons name="document-text-outline" size={24} color={Colors.warning} />
            </View>
            <Text style={styles.helpCardTitle}>CSV</Text>
            <Text style={styles.helpCardDesc}>
              HDFC, ICICI & most major banks support CSV export
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.h1,
    color: Colors.textPrimary,
    fontWeight: "800",
    fontFamily: Typography.fontFamilies.extrabold,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamilies.regular,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.labelMd,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamilies.semibold,
  },

  // Bank Chips
  bankScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bankChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
    alignItems: "center",
    ...Shadows.sm,
  },
  bankChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primarySm,
  },
  bankChipText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  bankChipTextActive: {
    color: Colors.onPrimary,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  emptySubtext: {
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.bodySm,
    fontFamily: Typography.fontFamilies.regular,
  },

  // File Picker
  filePickerButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  filePickerIconWrapper: {
    marginBottom: Spacing.md,
  },
  fileTypeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  filePickerText: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textSecondary,
    fontWeight: "500",
    fontFamily: Typography.fontFamilies.medium,
    textAlign: "center",
  },
  fileSize: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamilies.regular,
  },

  // Upload Button
  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: "center",
    minHeight: ComponentSizes.button.lg,
    justifyContent: "center",
    ...Shadows.primary,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textDisabled,
  },
  uploadButtonText: {
    color: Colors.onPrimary,
    fontSize: Typography.fontSize.bodyLg,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },

  // Result Card
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.success + "33",
    ...Shadows.lg,
  },
  resultIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadows.success,
  },
  resultText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: Typography.fontFamilies.semibold,
  },
  resultStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  resultStat: {
    color: Colors.textTertiary,
    fontSize: Typography.fontSize.bodySm,
    fontFamily: Typography.fontFamilies.medium,
  },

  // Help Section
  helpSection: {
    marginTop: Spacing.xl,
  },
  helpTitle: {
    fontSize: Typography.fontSize.h5,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    marginBottom: Spacing.lg,
  },
  helpGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  helpCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  helpIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  helpCardTitle: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  helpCardDesc: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: Typography.fontFamilies.regular,
  },
})