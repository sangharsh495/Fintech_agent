import { withUserScopedDb } from "@/server/db/rls-connection"
import { userProfiles, bankAccounts } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export async function saveUserProfile(
  userId: string,
  data: {
    dob?: string
    gender?: "male" | "female" | "other" | "prefer_not_to_say"
    occupation?: string
    incomeBracket?: "below_3l" | "3l_5l" | "5l_10l" | "10l_25l" | "above_25l"
    panNumber?: string
    city?: string
    state?: string
    consentDataProcessing: boolean
    consentMLAnalytics: boolean
    consentAIAssistant: boolean
    consentMarketing: boolean
  }
) {
  return withUserScopedDb(userId, async (db) => {
    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(userProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
    } else {
      await db.insert(userProfiles).values({ userId, ...data })
    }
  })
}

export async function markOnboardingComplete(userId: string) {
  return withUserScopedDb(userId, async (db) => {
    await db
      .update(userProfiles)
      .set({ onboardingComplete: true, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
  })
}

export async function addBankAccount(
  userId: string,
  data: {
    bankName: string
    accountNickname?: string
    accountLast4?: string
    accountType: "savings" | "current" | "salary"
  }
) {
  return withUserScopedDb(userId, async (db) => {
    const [account] = await db
      .insert(bankAccounts)
      .values({ userId, ...data })
      .returning()
    return account
  })
}

export async function getUserOnboardingStatus(userId: string) {
  return withUserScopedDb(userId, async (db) => {
    const [profile] = await db
      .select({ onboardingComplete: userProfiles.onboardingComplete })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)
    return profile?.onboardingComplete ?? false
  })
}

export async function getUserBankAccounts(userId: string) {
  return withUserScopedDb(userId, async (db) => {
    return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId))
  })
}
