import { useEffect, useState, useCallback } from "react"
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Switch,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../_layout"
import { profileApi, banksApi } from "../../lib/api"
import { logout } from "../../lib/auth"
import * as LocalAuthentication from "expo-local-authentication"
import * as Haptics from "expo-haptics"

export default function SettingsScreen() {
  const { token, user, setAuth } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)

  const [preferences, setPreferences] = useState({
    notifications: {
      budgetAlerts: true,
      taxReminders: true,
      securityAlerts: true,
      pushNotifications: true,
    },
    privacy: {
      shareAnalytics: false,
      allowRecommendations: true,
    },
    security: {
      biometricEnabled: false,
    }
  })

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const [profileRes, banksRes] = await Promise.all([
        profileApi.get(token).catch(() => null),
        banksApi.list(token).catch(() => ({ banks: [] })),
      ])
      if (profileRes) {
        setProfile(profileRes)
        if (profileRes.preferences) {
          setPreferences((prev) => ({
            notifications: {
              ...prev.notifications,
              ...profileRes.preferences.notifications,
            },
            privacy: {
              ...prev.privacy,
              ...profileRes.preferences.privacy,
            },
            security: {
              ...prev.security,
              ...profileRes.preferences.security,
            }
          }))
          if (profileRes.preferences.security?.biometricEnabled !== undefined) {
            setBiometricsEnabled(profileRes.preferences.security.biometricEnabled)
          }
        }
      }
      setBanks(banksRes.banks || [])
    } catch (error) {
      console.error("Settings fetch error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setBiometricsAvailable)
  }, [])

  const onRefresh = () => { setRefreshing(true); fetchData() }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout()
          setAuth(null, null)
        },
      },
    ])
  }

  const updatePreference = async (
    section: "notifications" | "privacy" | "security",
    key: string,
    value: boolean
  ) => {
    if (!token) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const updatedPreferences = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    }

    if (section === "security" && key === "biometricEnabled") {
      setBiometricsEnabled(value)
    }

    setPreferences(updatedPreferences)

    try {
      await profileApi.update(token, {
        preferences: updatedPreferences,
      })
    } catch (error) {
      console.error("Failed to update preferences:", error)
      Alert.alert("Error", "Could not sync setting to server. Please try again.")
      // Revert
      setPreferences(preferences)
      if (section === "security" && key === "biometricEnabled") {
        setBiometricsEnabled(!value)
      }
    }
  }

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometric login",
      })
      if (result.success) {
        updatePreference("security", "biometricEnabled", true)
      }
    } else {
      updatePreference("security", "biometricEnabled", false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name || "User"}</Text>
        <Text style={styles.profileEmail}>{user?.email || ""}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingRow
            icon="person-outline"
            label="Name"
            value={profile?.name || user?.name || "—"}
          />
          <SettingRow
            icon="mail-outline"
            label="Email"
            value={profile?.email || user?.email || "—"}
          />
          {profile?.phone && (
            <SettingRow icon="call-outline" label="Phone" value={profile.phone} />
          )}
          {profile?.city && (
            <SettingRow icon="location-outline" label="Location" value={`${profile.city}, ${profile.state || ""}`} />
          )}
        </View>
      </View>

      {/* Bank Accounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Accounts</Text>
        {banks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={32} color="#64748b" />
            <Text style={styles.emptyText}>No bank accounts linked</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {banks.map((bank, i) => (
              <View key={bank.id || i} style={[styles.row, i < banks.length - 1 && styles.rowBorder]}>
                <View style={styles.rowLeft}>
                  <Ionicons name="business-outline" size={20} color="#6366f1" />
                  <View>
                    <Text style={styles.rowLabel}>{bank.bankName}</Text>
                    <Text style={styles.rowSubLabel}>
                      {bank.accountNickname || bank.accountType || ""} {bank.accountLast4 ? `••••${bank.accountLast4}` : ""}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, bank.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.statusText, bank.isActive ? styles.activeText : styles.inactiveText]}>
                    {bank.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.card}>
          {biometricsAvailable && (
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="finger-print-outline" size={20} color="#6366f1" />
                <Text style={styles.switchLabel}>Biometric Login</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: "#334155", true: "#6366f1" }}
                thumbColor="#f8fafc"
              />
            </View>
          )}
          <SettingRow
            icon="shield-checkmark-outline"
            label="Data Encryption"
            value="AES-256"
          />
          <SettingRow
            icon="key-outline"
            label="Auth Method"
            value="JWT + SecureStore"
          />
        </View>
      </View>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="notifications-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Budget Alerts</Text>
            </View>
            <Switch
              value={preferences.notifications.budgetAlerts}
              onValueChange={(val) => updatePreference("notifications", "budgetAlerts", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={styles.switchLeft}>
              <Ionicons name="receipt-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Tax Reminders</Text>
            </View>
            <Switch
              value={preferences.notifications.taxReminders}
              onValueChange={(val) => updatePreference("notifications", "taxReminders", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={styles.switchLeft}>
              <Ionicons name="shield-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Security Alerts</Text>
            </View>
            <Switch
              value={preferences.notifications.securityAlerts}
              onValueChange={(val) => updatePreference("notifications", "securityAlerts", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={styles.switchLeft}>
              <Ionicons name="mail-unread-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={preferences.notifications.pushNotifications}
              onValueChange={(val) => updatePreference("notifications", "pushNotifications", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="analytics-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Share Anonymous Analytics</Text>
            </View>
            <Switch
              value={preferences.privacy.shareAnalytics}
              onValueChange={(val) => updatePreference("privacy", "shareAnalytics", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={styles.switchLeft}>
              <Ionicons name="bulb-outline" size={20} color="#6366f1" />
              <Text style={styles.switchLabel}>Personal Recommendations</Text>
            </View>
            <Switch
              value={preferences.privacy.allowRecommendations}
              onValueChange={(val) => updatePreference("privacy", "allowRecommendations", val)}
              trackColor={{ false: "#334155", true: "#6366f1" }}
              thumbColor="#f8fafc"
            />
          </View>
        </View>
      </View>
      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
          <SettingRow icon="code-slash-outline" label="Build" value="Expo SDK 57" />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

// Reusable row component
function SettingRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color="#6366f1" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  profileCard: {
    alignItems: "center", paddingVertical: 32, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: "#1e293b",
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#6366f1",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { fontSize: 28, color: "#fff", fontWeight: "800" },
  profileName: { fontSize: 22, color: "#f8fafc", fontWeight: "800" },
  profileEmail: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 14, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card: {
    backgroundColor: "#1e293b", borderRadius: 16, borderWidth: 1, borderColor: "#334155",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#334155" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 14, color: "#f8fafc", fontWeight: "500" },
  rowSubLabel: { fontSize: 12, color: "#64748b", marginTop: 1 },
  rowValue: { fontSize: 14, color: "#94a3b8" },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  switchLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { fontSize: 14, color: "#f8fafc", fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadge: { backgroundColor: "#22c55e22" },
  inactiveBadge: { backgroundColor: "#ef444422" },
  statusText: { fontSize: 12, fontWeight: "600" },
  activeText: { color: "#22c55e" },
  inactiveText: { color: "#ef4444" },
  emptyCard: {
    backgroundColor: "#1e293b", borderRadius: 16, padding: 32,
    alignItems: "center", borderWidth: 1, borderColor: "#334155", gap: 8,
  },
  emptyText: { color: "#64748b", fontSize: 14 },
  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 20, marginTop: 32, paddingVertical: 16, borderRadius: 14,
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#ef444433",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
})
