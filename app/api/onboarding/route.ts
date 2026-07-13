import { NextRequest, NextResponse } from "next/server"
import { safeLogError } from "@/server/lib/safe-log"
import { auth } from "@/server/auth"
import { saveUserProfile, markOnboardingComplete } from "@/server/services/onboarding.service"
import { z } from "zod"

const profileSchema = z.object({
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  occupation: z.string().optional(),
  incomeBracket: z.enum(["below_3l", "3l_5l", "5l_10l", "10l_25l", "above_25l"]).optional(),
  panNumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  consentDataProcessing: z.boolean().default(false),
  consentMLAnalytics: z.boolean().default(false),
  consentAIAssistant: z.boolean().default(false),
  consentMarketing: z.boolean().default(false),
  complete: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Remove empty strings so Zod uses the .optional() / .default() behaviors
    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== "")
    )
    const { complete, ...data } = profileSchema.parse(cleanBody)

    await saveUserProfile(session.user.id, data)

    if (complete) {
      await markOnboardingComplete(session.user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    safeLogError("[ONBOARDING]", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
