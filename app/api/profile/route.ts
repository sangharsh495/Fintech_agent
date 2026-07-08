import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import { users, userProfiles } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateProfileSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    dob: z.string().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    occupation: z.string().optional(),
    incomeBracket: z.enum(["below_3l", "3l_5l", "5l_10l", "10l_25l", "above_25l"]).optional(),
    panNumber: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    preferences: z.any().optional(), // Flexible JSON object
})

export async function GET(req: NextRequest) {
    const session = await getSession(req)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch from users and userProfiles tables
    const userList = await db.select().from(users).where(eq(users.id, session.user.id))
    const user = userList[0]
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const profileList = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id))
    const profile = profileList[0] || {}

    let preferences = {}
    if (profile.preferences) {
        try {
            preferences = JSON.parse(profile.preferences)
        } catch {
            // Ignored
        }
    }

    return NextResponse.json({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        panNumber: profile.panNumber || "",
        aadhaarLast4: profile.aadhaarLast4 || "",
        city: profile.city || "",
        state: profile.state || "",
        occupation: profile.occupation || "",
        incomeBracket: profile.incomeBracket || "",
        preferences,
    })
}

export async function PATCH(req: NextRequest) {
    const session = await getSession(req)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        // Remove empty strings to work with Zod optional validation
        const cleanBody = Object.fromEntries(
            Object.entries(body).filter(([_, v]) => v !== "")
        )
        const data = updateProfileSchema.parse(cleanBody)

        // Update users table (name, phone)
        if (data.name !== undefined || data.phone !== undefined) {
            await db
                .update(users)
                .set({
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.phone !== undefined && { phone: data.phone }),
                    updatedAt: new Date(),
                })
                .where(eq(users.id, session.user.id))
        }

        // Update user_profiles table (the rest)
        const { name, phone, preferences, ...profileData } = data

        const dbPayload: any = { ...profileData, updatedAt: new Date() }
        if (preferences !== undefined) {
            dbPayload.preferences = JSON.stringify(preferences)
        }

        if (Object.keys(dbPayload).length > 1) { // > 1 because updatedAt is always there
            // Check if profile exists first
            const profileExists = await db
                .select({ id: userProfiles.id })
                .from(userProfiles)
                .where(eq(userProfiles.userId, session.user.id))

            if (profileExists.length > 0) {
                await db
                    .update(userProfiles)
                    .set(dbPayload)
                    .where(eq(userProfiles.userId, session.user.id))
            } else {
                await db
                    .insert(userProfiles)
                    .values({
                        userId: session.user.id,
                        ...dbPayload,
                        onboardingComplete: false, // Don't magically complete onboarding
                    })
            }
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully" })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
        }
        console.error("[PROFILE PATCH]", error)
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
}
