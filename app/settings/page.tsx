"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Bell, ChevronRight, Lock, Save, Shield, Trash2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const tabs = ["profile", "security", "notifications", "danger"]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [userData, setUserData] = useState({ name: "", email: "", phone: "", city: "", state: "", occupation: "", annualIncome: "" })
  const [security, setSecurity] = useState({ twoFactorEnabled: false, loginAlerts: true })
  const [notifications, setNotifications] = useState({ budgetAlerts: true, taxReminders: true, weeklyReports: true })

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setUserData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          state: data.state || "",
          occupation: data.occupation || "",
          annualIncome: data.incomeBracket || "",
        }))
      })
      .catch(() => {})
  }, [])

  const saveSettings = async () => {
    setSaveStatus("saving")
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          city: userData.city,
          state: userData.state,
          occupation: userData.occupation,
          incomeBracket: userData.annualIncome,
          preferences: { security, notifications },
        }),
      })
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 1600)
    } catch {
      setSaveStatus("idle")
    }
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <main className="mx-auto w-full max-w-[var(--content-max-md)] py-[var(--section-spacing-desktop)]">
        <header className="mb-[var(--card-padding-xl)]">
          <h1 className="app-heading-1">Settings</h1>
          <p className="app-body-lg app-muted mt-2">Manage profile, preferences, security, and account controls.</p>
        </header>

        <nav className="mb-[var(--card-padding-xl)] flex gap-4 overflow-x-auto border-b border-border" aria-label="Settings sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "min-h-[var(--touch-target-min)] whitespace-nowrap border-b-2 border-transparent px-[var(--card-padding-md)] app-body-md font-medium capitalize text-muted-foreground transition-colors",
                activeTab === tab && "border-primary text-primary",
              )}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "profile" && (
          <section className="space-y-6">
            <div>
              <h2 className="app-heading-2">Profile</h2>
              <p className="app-body-md app-muted">Your personal details for financial personalization.</p>
            </div>
            <Card>
              <CardContent className="p-[var(--card-padding-xl)]">
                <div className="mb-8 flex flex-col items-center text-center">
                  <div className="mb-4 flex size-[var(--avatar-xl)] items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="size-[var(--icon-xl)]" />
                  </div>
                  <h3 className="app-heading-3">{userData.name || "FinFlow User"}</h3>
                  <p className="app-body-md app-muted">{userData.email || "No email available"}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.keys(userData).filter((key) => key !== "email").map((key) => (
                    <label key={key} className="app-body-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                      <Input className="mt-1" value={(userData as any)[key]} onChange={(event) => setUserData((prev) => ({ ...prev, [key]: event.target.value }))} />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === "security" && (
          <section className="space-y-6">
            <div>
              <h2 className="app-heading-2">Security</h2>
              <p className="app-body-md app-muted">Review sign-in and privacy controls.</p>
            </div>
            <Card>
              <CardContent className="p-[var(--card-padding-xl)]">
                {[
                  { key: "twoFactorEnabled", title: "Two-factor authentication", desc: "Require an extra verification step.", icon: Lock },
                  { key: "loginAlerts", title: "Login alerts", desc: "Notify me when a new device signs in.", icon: Shield },
                ].map(({ key, title, desc, icon: Icon }) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 hover:bg-muted">
                    <span className="flex items-center gap-4">
                      <Icon className="size-[var(--icon-md)] text-primary" />
                      <span>
                        <span className="app-body-md block font-medium">{title}</span>
                        <span className="app-body-sm app-muted">{desc}</span>
                      </span>
                    </span>
                    <input type="checkbox" checked={(security as any)[key]} onChange={(event) => setSecurity((prev) => ({ ...prev, [key]: event.target.checked }))} />
                  </label>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === "notifications" && (
          <section className="space-y-6">
            <div>
              <h2 className="app-heading-2">Notifications</h2>
              <p className="app-body-md app-muted">Choose what FinFlow should remind you about.</p>
            </div>
            <Card>
              <CardContent className="p-[var(--card-padding-xl)]">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 hover:bg-muted">
                    <span className="flex items-center gap-4">
                      <Bell className="size-[var(--icon-md)] text-primary" />
                      <span className="app-body-md font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </span>
                    <input type="checkbox" checked={value} onChange={(event) => setNotifications((prev) => ({ ...prev, [key]: event.target.checked }))} />
                  </label>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === "danger" && (
          <section className="space-y-6">
            <div>
              <h2 className="app-heading-2 text-destructive">Danger Zone</h2>
              <p className="app-body-md app-muted">Destructive account actions require confirmation.</p>
            </div>
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-[var(--card-padding-xl)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="size-[var(--icon-lg)] text-destructive" />
                    <div>
                      <h3 className="app-heading-3">Delete account data</h3>
                      <p className="app-body-md app-muted">This action is permanent and should be used carefully.</p>
                    </div>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="size-[var(--icon-sm)]" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <div className="mt-[var(--card-padding-xl)] flex justify-end gap-4 border-t border-border pt-[var(--card-padding-xl)]">
          <Button variant="outline">
            More
            <ChevronRight className="size-[var(--icon-sm)]" />
          </Button>
          <Button onClick={saveSettings} disabled={saveStatus === "saving"}>
            <Save className="size-[var(--icon-sm)]" />
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Changes"}
          </Button>
        </div>
      </main>
    </div>
  )
}
