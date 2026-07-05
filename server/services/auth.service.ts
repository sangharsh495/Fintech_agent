import bcrypt from "bcryptjs"
import { db } from "@/server/db"
import { users, otpVerifications } from "@/server/db/schema"
import { eq, and, gt } from "drizzle-orm"
import type { NewUser } from "@/server/db/schema"

// ─── Password ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── OTP ─────────────────────────────────────────────────────

export function generateOTP(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  // Expire previous OTPs for this email
  await db
    .update(otpVerifications)
    .set({ used: true })
    .where(eq(otpVerifications.email, email))

  // Store new OTP with 5-minute TTL
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  await db.insert(otpVerifications).values({
    email,
    otp,
    expiresAt,
    used: false,
  })
}

export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  const [record] = await db
    .select()
    .from(otpVerifications)
    .where(
      and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.used, false),
        gt(otpVerifications.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!record) {
    return { success: false, message: "Invalid or expired OTP" }
  }

  // Mark OTP as used
  await db
    .update(otpVerifications)
    .set({ used: true })
    .where(eq(otpVerifications.id, record.id))

  // Mark user email as verified
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email))

  return { success: true, message: "Email verified successfully" }
}

// ─── Email ───────────────────────────────────────────────────

export async function sendOTPEmail(email: string, otp: string, name?: string): Promise<void> {
  // If Resend API key is configured, send a real email
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_your_")) {
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: "FinFlow <onboarding@resend.dev>",
      to: email,
      subject: "Your FinFlow verification code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;color:#f8fafc;border-radius:12px;">
          <h1 style="font-size:24px;margin-bottom:8px;">₹ FinFlow</h1>
          <p style="color:#94a3b8;margin-bottom:32px;">Your Personal Finance Assistant</p>
          <p style="margin-bottom:8px;">Hi ${name ?? "there"},</p>
          <p style="color:#94a3b8;margin-bottom:24px;">Use this code to verify your email address. It expires in 5 minutes.</p>
          <div style="background:#1e293b;border-radius:8px;padding:24px;text-align:center;letter-spacing:0.5em;font-size:36px;font-weight:bold;font-family:monospace;color:#6366f1;margin-bottom:24px;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:12px;">If you didn't create a FinFlow account, you can safely ignore this email.</p>
        </div>
      `,
    })
    return
  }

  // Development fallback — OTP printed to server terminal
  console.log(`
  ╔══════════════════════════════════════╗
  ║        FinFlow Email Verification    ║
  ╠══════════════════════════════════════╣
  ║  To: ${email.padEnd(33)}║
  ║  Hi ${(name || "there").padEnd(33)}║
  ║                                      ║
  ║  Your OTP is: ${otp.padEnd(23)}║
  ║  Valid for: 5 minutes                ║
  ╚══════════════════════════════════════╝
  `)
}


// ─── User Management ─────────────────────────────────────────

export async function createUser(
  email: string,
  hashedPassword: string,
  name: string
): Promise<{ id: string; email: string; name: string }> {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashedPassword,
      name,
    })
    .returning({ id: users.id, email: users.email, name: users.name })

  return user as { id: string; email: string; name: string }
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return user || null
}

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return user || null
}
