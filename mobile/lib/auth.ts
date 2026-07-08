import { authApi } from "./api"
import { saveToken, saveUser, getToken, getUser, clearAuth } from "./secure-store"

export type AuthUser = {
  id: string
  email: string
  name: string
  image: string | null
}

/**
 * Login with email and password.
 * Stores the JWT token and user data securely.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const result = await authApi.login({ email, password })
  await saveToken(result.token)
  await saveUser(result.user)
  return result.user
}

/**
 * Register a new account.
 * Returns the userId — the user still needs to verify OTP.
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ userId: string; message: string }> {
  const result = await authApi.register({ name, email, password })
  return { userId: result.userId, message: result.message }
}

/**
 * Verify OTP for email verification.
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const result = await authApi.verifyOtp({ email, otp })
  return result.success
}

/**
 * Resend OTP to email.
 */
export async function resendOtp(email: string): Promise<boolean> {
  const result = await authApi.sendOtp({ email })
  return result.success
}

/**
 * Logout — clears all stored auth data.
 */
export async function logout(): Promise<void> {
  await clearAuth()
}

/**
 * Check if user is authenticated.
 * Returns the user data if a valid token exists, null otherwise.
 */
export async function checkAuth(): Promise<{ token: string; user: AuthUser } | null> {
  const token = await getToken()
  const user = await getUser()
  if (token && user) {
    return { token, user }
  }
  return null
}

/**
 * Get the current auth token (for API calls).
 */
export { getToken }
