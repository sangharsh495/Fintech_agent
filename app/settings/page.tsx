"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Lock,
  Upload,
  User,
  Shield,
  LogOut,
  Key,
  Bell,
  Sun,
  Moon,
  Settings,
  CheckCircle,
  Download,
  Trash2,
  CreditCard,
  Building2,
  Globe,
  Smartphone,
  Mail,
  FileText,
  Eye,
  EyeOff,
  Fingerprint,
  Wallet,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  IndianRupee,
  Languages,
  Clock,
  Calendar,
  Briefcase,
  Heart,
  Users,
  Link2,
  Unlink,
  Check,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    pan: "",
    aadhaar: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    occupation: "",
    annualIncome: "",
    maritalStatus: "",
  })
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const router = useRouter()

  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    taxReminders: true,
    investmentUpdates: true,
    billReminders: true,
    securityAlerts: true,
    weeklyReports: true,
    monthlyStatements: true,
    marketNews: false,
    promotions: false,
    smsAlerts: true,
    pushNotifications: true,
    emailDigest: "daily",
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: false,
    showTransactions: false,
    shareAnalytics: false,
    allowRecommendations: true,
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    biometricEnabled: true,
    loginAlerts: true,
    sessionTimeout: "30",
  })

  const [regional, setRegional] = useState({
    language: "en-in",
    currency: "INR",
    timezone: "IST",
    dateFormat: "dd/mm/yyyy",
    financialYear: "apr-mar",
  })

  const [consent, setConsent] = useState({
    consentDataProcessing: false,
    consentMLAnalytics: false,
    consentAIAssistant: false,
    consentMarketing: false,
  })

  const [linkedAccounts, setLinkedAccounts] = useState([
    { id: 1, name: "HDFC Bank", type: "Savings", number: "XXXX1234", connected: true, icon: Building2 },
    { id: 2, name: "ICICI Bank", type: "Current", number: "XXXX5678", connected: true, icon: Building2 },
    { id: 3, name: "Zerodha", type: "Demat", number: "XXXX9012", connected: true, icon: Briefcase },
    { id: 4, name: "Google Pay", type: "UPI", number: "john@oksbi", connected: false, icon: Wallet },
  ])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setIsDarkMode(savedTheme === "dark")

    // Fetch user profile
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile")
        return res.json()
      })
      .then((data) => {
        setUserData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || prev.email,
          phone: data.phone || "",
          dateOfBirth: data.dob || "",
          gender: data.gender || "",
          pan: data.panNumber || "",
          aadhaar: data.aadhaarLast4 || "",
          city: data.city || "",
          state: data.state || "",
          occupation: data.occupation || "",
          annualIncome: data.incomeBracket || "",
        }))
        if (data.preferences) {
          if (data.preferences.security) setSecurity(s => ({ ...s, ...data.preferences.security }))
          if (data.preferences.privacy) setPrivacy(p => ({ ...p, ...data.preferences.privacy }))
          if (data.preferences.notifications) setNotifications(n => ({ ...n, ...data.preferences.notifications }))
          if (data.preferences.regional) setRegional(r => ({ ...r, ...data.preferences.regional }))
        }
        setConsent({
          consentDataProcessing: data.consentDataProcessing || false,
          consentMLAnalytics: data.consentMLAnalytics || false,
          consentAIAssistant: data.consentAIAssistant || false,
          consentMarketing: data.consentMarketing || false,
        })
      })
      .catch((err) => console.error("Error fetching profile:", err))
  }, [])

  const handleThemeChange = (dark: boolean) => {
    setIsDarkMode(dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
    document.documentElement.classList.toggle("dark", dark)
  }

  const handleToggleConnect = (id: number) => {
    setLinkedAccounts(prev =>
      prev.map(account =>
        account.id === id ? { ...account, connected: !account.connected } : account
      )
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    router.push("/auth/login")
  }

  const saveSettings = async (updates: {
    userDataUpdate?: typeof userData;
    consentUpdate?: typeof consent;
    securityUpdate?: typeof security;
    privacyUpdate?: typeof privacy;
    notificationsUpdate?: typeof notifications;
    regionalUpdate?: typeof regional;
  }) => {
    setSaveStatus("saving")
    const currentSecurity = updates.securityUpdate || security
    const currentPrivacy = updates.privacyUpdate || privacy
    const currentNotifications = updates.notificationsUpdate || notifications
    const currentRegional = updates.regionalUpdate || regional
    const currentConsent = updates.consentUpdate || consent
    const currentUserData = updates.userDataUpdate || userData

    const payload = {
      name: currentUserData.name,
      phone: currentUserData.phone,
      dob: currentUserData.dateOfBirth,
      gender: currentUserData.gender,
      occupation: currentUserData.occupation,
      incomeBracket: currentUserData.annualIncome,
      panNumber: currentUserData.pan,
      city: currentUserData.city,
      state: currentUserData.state,
      consentDataProcessing: currentConsent.consentDataProcessing,
      consentMLAnalytics: currentConsent.consentMLAnalytics,
      consentAIAssistant: currentConsent.consentAIAssistant,
      consentMarketing: currentConsent.consentMarketing,
      preferences: {
        security: currentSecurity,
        privacy: currentPrivacy,
        notifications: currentNotifications,
        regional: currentRegional,
      }
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("Save failed:", error)
      setSaveStatus("idle")
    }
  }

  const handleSave = async () => {
    await saveSettings({})
  }

  const handleSecurityChange = (key: keyof typeof security, value: any) => {
    const next = { ...security, [key]: value }
    setSecurity(next)
    saveSettings({ securityUpdate: next })
  }

  const handlePrivacyChange = (key: keyof typeof privacy, value: any) => {
    const next = { ...privacy, [key]: value }
    setPrivacy(next)
    saveSettings({ privacyUpdate: next })
  }

  const handleConsentChange = (key: keyof typeof consent, value: any) => {
    const next = { ...consent, [key]: value }
    setConsent(next)
    saveSettings({ consentUpdate: next })
  }

  const handleNotificationsChange = (key: keyof typeof notifications, value: any) => {
    const next = { ...notifications, [key]: value }
    setNotifications(next)
    saveSettings({ notificationsUpdate: next })
  }

  const handleRegionalChange = (key: keyof typeof regional, value: any) => {
    const next = { ...regional, [key]: value }
    setRegional(next)
    saveSettings({ regionalUpdate: next })
  }

  const tabs = [
    { id: "profile", label: "Personal Info", icon: User },
    { id: "kyc", label: "KYC Details", icon: FileText },
    { id: "security", label: "Security", icon: Shield },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "linked", label: "Linked Accounts", icon: Link2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "data", label: "Data & Storage", icon: Download },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ]

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
    </label>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">

        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Settings className="w-4 h-4" />
              Account Settings
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Manage <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Manage your personal information, security preferences, linked accounts, notifications, and customize your
              financial dashboard experience.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Column - Tabs */}
          <div className="xl:col-span-1">
            <Card className="p-3 border border-border sticky top-24">
              <div className="flex flex-row xl:flex-col gap-1.5 overflow-x-auto xl:overflow-visible pb-2 xl:pb-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm w-full text-left",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xl:inline">{tab.label}</span>
                    </button>
                  )
                })}

                {/* Logout Button */}
                <div className="border-t border-border pt-2 mt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm w-full text-left text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden xl:inline">Logout</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="xl:col-span-4">
            {/* Personal Info Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
                        <User className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{userData.name}</h2>
                        <p className="text-muted-foreground">{userData.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Verified Account
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Full Name</label>
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email Address</label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={userData.dateOfBirth}
                          onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Gender</label>
                      <select
                        value={userData.gender}
                        onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Marital Status</label>
                      <select
                        value={userData.maritalStatus}
                        onChange={(e) => setUserData({ ...userData, maritalStatus: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold mb-2">City</label>
                        <input
                          type="text"
                          value={userData.city}
                          onChange={(e) => setUserData({ ...userData, city: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">State</label>
                        <input
                          type="text"
                          value={userData.state}
                          onChange={(e) => setUserData({ ...userData, state: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">PIN Code</label>
                      <input
                        type="text"
                        value={userData.pincode}
                        onChange={(e) => setUserData({ ...userData, pincode: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Personal Information"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* KYC Details Tab */}
            {activeTab === "kyc" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        KYC Verification
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your identity documents for regulatory compliance
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Fully Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">PAN Card</p>
                            <p className="text-xs text-muted-foreground">Permanent Account Number</p>
                          </div>
                        </div>
                        <span className="text-emerald-600 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10">
                          Verified
                        </span>
                      </div>
                      <input
                        type="text"
                        value={userData.pan}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground font-mono"
                      />
                    </div>

                    <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Fingerprint className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">Aadhaar Card</p>
                            <p className="text-xs text-muted-foreground">Unique Identification</p>
                          </div>
                        </div>
                        <span className="text-emerald-600 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10">
                          Verified
                        </span>
                      </div>
                      <input
                        type="text"
                        value={userData.aadhaar}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground font-mono"
                      />
                    </div>

                    <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Occupation</p>
                          <p className="text-xs text-muted-foreground">Employment status</p>
                        </div>
                      </div>
                      <select
                        value={userData.occupation}
                        onChange={(e) => setUserData({ ...userData, occupation: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="Salaried">Salaried</option>
                        <option value="Self Employed">Self Employed</option>
                        <option value="Business Owner">Business Owner</option>
                        <option value="Professional">Professional</option>
                        <option value="Retired">Retired</option>
                        <option value="Student">Student</option>
                        <option value="Homemaker">Homemaker</option>
                      </select>
                    </div>

                    <div className="p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Annual Income</p>
                          <p className="text-xs text-muted-foreground">Yearly earnings bracket</p>
                        </div>
                      </div>
                      <select
                        value={userData.annualIncome}
                        onChange={(e) => setUserData({ ...userData, annualIncome: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      >
                        <option value="">Select Bracket</option>
                        <option value="below_3l">Below ₹3 Lakhs</option>
                        <option value="3l_5l">₹3 Lakhs - ₹5 Lakhs</option>
                        <option value="5l_10l">₹5 Lakhs - ₹10 Lakhs</option>
                        <option value="10l_25l">₹10 Lakhs - ₹25 Lakhs</option>
                        <option value="above_25l">Above ₹25 Lakhs</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-amber-600">Document Update Notice</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          To update your PAN or Aadhaar details, please contact our support team with valid
                          documentation. Changes require manual verification for security purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save KYC Details"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Change Password
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Update your password regularly to keep your account secure
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Min 8 chars with uppercase, lowercase & numbers
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                  <Button className="mt-6 btn-interactive rounded-xl">Update Password</Button>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Options
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Key className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Add extra security with OTP verification</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={security.twoFactorEnabled}
                        onChange={(val) => handleSecurityChange("twoFactorEnabled", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Fingerprint className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Biometric Login</p>
                          <p className="text-sm text-muted-foreground">Use fingerprint or Face ID to login</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={security.biometricEnabled}
                        onChange={(val) => handleSecurityChange("biometricEnabled", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bell className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Login Alerts</p>
                          <p className="text-sm text-muted-foreground">Get notified of new device logins</p>
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={security.loginAlerts}
                        onChange={(val) => handleSecurityChange("loginAlerts", val)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Session Timeout</p>
                          <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                        </div>
                      </div>
                      <select
                        value={security.sessionTimeout}
                        onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
                        className="px-4 py-2 rounded-xl border border-border bg-secondary/50 text-foreground text-sm"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Security Preferences"
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Active Sessions
                  </h2>
                  <div className="space-y-3">
                    {[
                      { device: "MacBook Pro", location: "Mumbai, India", time: "Active now", current: true },
                      { device: "iPhone 15 Pro", location: "Mumbai, India", time: "2 hours ago", current: false },
                      { device: "Chrome - Windows", location: "Delhi, India", time: "Yesterday", current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              {session.device}
                              {session.current && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                  This device
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.location} • {session.time}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Privacy Settings
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Control what data is visible and how it is used</p>

                  <div className="space-y-4">
                    {[
                      {
                        key: "profileVisible",
                        title: "Public Profile",
                        desc: "Allow others to view your basic profile information",
                        icon: User,
                      },
                      {
                        key: "showTransactions",
                        title: "Transaction History Sharing",
                        desc: "Share transaction patterns for better recommendations",
                        icon: CreditCard,
                      },
                      {
                        key: "shareAnalytics",
                        title: "Analytics Data",
                        desc: "Help improve app by sharing anonymous usage data",
                        icon: Settings,
                      },
                      {
                        key: "allowRecommendations",
                        title: "Personalized Recommendations",
                        desc: "Get tailored financial tips based on your spending",
                        icon: Heart,
                      },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                          <ToggleSwitch
                            checked={privacy[item.key as keyof typeof privacy]}
                            onChange={(val) => handlePrivacyChange(item.key as keyof typeof privacy, val)}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Privacy Settings"
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Data & AI Consents
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Manage your consents for data processing and AI analytics</p>

                  <div className="space-y-4">
                    {[
                      {
                        key: "consentDataProcessing",
                        title: "Core Data Processing",
                        desc: "Allow processing of uploaded statements and financial data to run the platform",
                      },
                      {
                        key: "consentMLAnalytics",
                        title: "Machine Learning Analytics",
                        desc: "Allow running ML clustering and prediction models on your transactions",
                      },
                      {
                        key: "consentAIAssistant",
                        title: "Gemini AI Assistant",
                        desc: "Allow sharing relevant transactions and questions with Gemini AI for insights",
                      },
                      {
                        key: "consentMarketing",
                        title: "Personalized Financial Offers",
                        desc: "Allow using anonymized data to recommend relevant tax savers or products",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <ToggleSwitch
                          checked={consent[item.key as keyof typeof consent]}
                          onChange={(val) => handleConsentChange(item.key as keyof typeof consent, val)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Consent Settings"
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Legal & Compliance
                  </h2>
                  <div className="space-y-3">
                    {[
                      { title: "Privacy Policy", desc: "How we collect and use your data" },
                      { title: "Terms of Service", desc: "Rules and guidelines for using our platform" },
                      { title: "Cookie Policy", desc: "How we use cookies and tracking" },
                      { title: "Data Processing Agreement", desc: "GDPR and data protection compliance" },
                    ].map((doc, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Linked Accounts Tab */}
            {activeTab === "linked" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        Linked Accounts
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage your connected banks and financial accounts
                      </p>
                    </div>
                    <Button className="btn-interactive rounded-xl">
                      <Building2 className="w-4 h-4 mr-2" />
                      Add Account
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {linkedAccounts.map((account) => {
                      const Icon = account.icon
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-5 rounded-xl bg-secondary/30 border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                {account.name}
                                {account.connected ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Connected
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Disconnected
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {account.type} • {account.number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="rounded-lg">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={account.connected ? "outline" : "default"}
                              size="sm"
                              className="rounded-lg"
                              onClick={() => handleToggleConnect(account.id)}
                            >
                              {account.connected ? (
                                <>
                                  <Unlink className="w-4 h-4 mr-1" /> Unlink
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 mr-1" /> Reconnect
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Methods
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { type: "Credit Card", name: "HDFC Regalia", number: "•••• 4532", expiry: "12/27" },
                      { type: "Debit Card", name: "ICICI Platinum", number: "•••• 8921", expiry: "08/26" },
                    ].map((card, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-medium text-muted-foreground">{card.type}</span>
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-mono text-lg mb-1">{card.number}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">{card.name}</p>
                          <p className="text-xs text-muted-foreground">Exp: {card.expiry}</p>
                        </div>
                      </div>
                    ))}
                    <button className="p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                      <CreditCard className="w-8 h-8" />
                      <span className="text-sm font-medium">Add New Card</span>
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Choose what updates you want to receive</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                        Financial Alerts
                      </h3>
                      <div className="space-y-3">
                        {[
                          { key: "budgetAlerts", title: "Budget Alerts", desc: "When you exceed budget limits" },
                          {
                            key: "taxReminders",
                            title: "Tax Reminders",
                            desc: "Tax filing deadlines and deduction tips",
                          },
                          {
                            key: "investmentUpdates",
                            title: "Investment Updates",
                            desc: "Portfolio changes and opportunities",
                          },
                          {
                            key: "billReminders",
                            title: "Bill Reminders",
                            desc: "Upcoming bill payments and due dates",
                          },
                        ].map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                              <ToggleSwitch
                               checked={notifications[item.key as keyof typeof notifications] as boolean}
                               onChange={(val) => handleNotificationsChange(item.key as keyof typeof notifications, val)}
                             />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                        Reports & Summaries
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            key: "securityAlerts",
                            title: "Security Alerts",
                            desc: "Suspicious activity and login attempts",
                          },
                          {
                            key: "weeklyReports",
                            title: "Weekly Reports",
                            desc: "Weekly spending summary and insights",
                          },
                          {
                            key: "monthlyStatements",
                            title: "Monthly Statements",
                            desc: "Detailed monthly financial statements",
                          },
                        ].map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <ToggleSwitch
                              checked={notifications[item.key as keyof typeof notifications] as boolean}
                              onChange={(val) => handleNotificationsChange(item.key as keyof typeof notifications, val)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                        Communication Channels
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">SMS</span>
                            </div>
                            <ToggleSwitch
                              checked={notifications.smsAlerts}
                              onChange={(val) => handleNotificationsChange("smsAlerts", val)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Critical alerts via text</p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">Push</span>
                            </div>
                            <ToggleSwitch
                              checked={notifications.pushNotifications}
                              onChange={(val) => handleNotificationsChange("pushNotifications", val)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">In-app notifications</p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                          <div className="flex items-center gap-2 mb-3">
                            <Mail className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Email Digest</span>
                          </div>
                          <select
                            value={notifications.emailDigest}
                            onChange={(e) => handleNotificationsChange("emailDigest", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-sm"
                          >
                            <option value="instant">Instant</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="never">Never</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Notification Preferences"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                    Appearance
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleThemeChange(false)}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group",
                        !isDarkMode
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/50 bg-card",
                      )}
                    >
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                          !isDarkMode ? "bg-amber-400 shadow-lg" : "bg-secondary",
                        )}
                      >
                        <Sun className={cn("w-7 h-7", !isDarkMode ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <span className="font-semibold">Light</span>
                      {!isDarkMode && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleThemeChange(true)}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group",
                        isDarkMode
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/50 bg-card",
                      )}
                    >
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                          isDarkMode ? "bg-indigo-600 shadow-lg" : "bg-secondary",
                        )}
                      >
                        <Moon className={cn("w-7 h-7", isDarkMode ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <span className="font-semibold">Dark</span>
                      {isDarkMode && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Regional Settings
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Languages className="w-4 h-4" /> Language
                      </label>
                      <select
                        value={regional.language}
                        onChange={(e) => handleRegionalChange("language", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="en-in">English (India)</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" /> Currency
                      </label>
                      <select
                        value={regional.currency}
                        onChange={(e) => handleRegionalChange("currency", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Timezone
                      </label>
                      <select
                        value={regional.timezone}
                        onChange={(e) => handleRegionalChange("timezone", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none"
                      >
                        <option value="IST">IST (UTC+5:30)</option>
                        <option value="EST">EST (UTC-5)</option>
                        <option value="PST">PST (UTC-8)</option>
                        <option value="GMT">GMT (UTC+0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Date Format
                      </label>
                      <select
                        value={regional.dateFormat}
                        onChange={(e) => handleRegionalChange("dateFormat", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none"
                      >
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Financial Year
                      </label>
                      <select
                        value={regional.financialYear}
                        onChange={(e) => handleRegionalChange("financialYear", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none"
                      >
                        <option value="apr-mar">April - March (India)</option>
                        <option value="jan-dec">January - December</option>
                        <option value="jul-jun">July - June</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={handleSave}
                      className="w-full md:w-auto btn-interactive rounded-xl"
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === "saved" ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Changes Saved!
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Data & Storage Tab */}
            {activeTab === "data" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Import Data
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Import your financial data from other sources</p>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-semibold mb-2 text-foreground">Upload Financial Documents</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Support for CSV, Excel, PDF bank statements, and more
                    </p>
                    <Button variant="outline" className="rounded-xl bg-transparent">
                      Select Files
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Export & Backup
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Export All Data", desc: "Download complete financial history", format: "JSON/CSV" },
                      { title: "Transaction History", desc: "Export all transactions", format: "Excel" },
                      { title: "Tax Reports", desc: "Download tax-related documents", format: "PDF" },
                      { title: "Investment Portfolio", desc: "Export portfolio details", format: "CSV" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
                      >
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                          <Download className="w-4 h-4 mr-1" />
                          {item.format}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Data Protection
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "256-bit AES Encryption",
                        desc: "Bank-grade data encryption",
                        status: "Active",
                        color: "emerald",
                      },
                      {
                        title: "Data Isolation",
                        desc: "Your data is completely isolated",
                        status: "Active",
                        color: "emerald",
                      },
                      { title: "Auto Backup", desc: "Daily automatic backups", status: "Enabled", color: "blue" },
                      {
                        title: "Data Retention",
                        desc: "7 years as per regulations",
                        status: "Compliant",
                        color: "amber",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium px-3 py-1 rounded-full",
                            item.color === "emerald" && "bg-emerald-500/10 text-emerald-600",
                            item.color === "blue" && "bg-blue-500/10 text-blue-600",
                            item.color === "amber" && "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-2 border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-2 text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete all your data and close your account. This action cannot be undone and all
                        your financial records will be lost forever.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 bg-transparent"
                        >
                          Clear All Data
                        </Button>
                        <Button variant="destructive" className="rounded-xl">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Help & Support Tab */}
            {activeTab === "help" && (
              <div className="space-y-6 slide-up">
                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Help Center
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">Find answers and get support</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: FileText, title: "FAQs", desc: "Frequently asked questions" },
                      { icon: MessageSquare, title: "Live Chat", desc: "Chat with support team" },
                      { icon: Mail, title: "Email Support", desc: "support@financeapp.com" },
                      { icon: Smartphone, title: "Call Us", desc: "1800-XXX-XXXX" },
                      { icon: Users, title: "Community", desc: "Join our user forum" },
                      { icon: FileText, title: "User Guide", desc: "Detailed documentation" },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={i}
                          className="p-5 rounded-xl bg-secondary/30 border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Send Feedback
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Subject</label>
                      <select className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground">
                        <option>Bug Report</option>
                        <option>Feature Request</option>
                        <option>General Feedback</option>
                        <option>Account Issue</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Message</label>
                      <textarea
                        rows={4}
                        placeholder="Describe your feedback or issue..."
                        className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                      />
                    </div>
                    <Button className="btn-interactive rounded-xl">
                      <Mail className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 border border-border">
                  <h2 className="text-xl font-bold mb-4">App Information</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-muted-foreground">Version</p>
                      <p className="font-semibold">2.4.1</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-muted-foreground">Build</p>
                      <p className="font-semibold">2024.01.15</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-muted-foreground">Platform</p>
                      <p className="font-semibold">Web</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-muted-foreground">Environment</p>
                      <p className="font-semibold">Production</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
