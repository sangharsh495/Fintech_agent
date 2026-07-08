import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "finflow_auth_token"
const USER_KEY = "finflow_user_data"

/**
 * Securely store the JWT token in the device's hardware-backed Keychain/Keystore
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

/**
 * Retrieve the JWT token from secure storage
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

/**
 * Delete the JWT token (used during logout)
 */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

/**
 * Save user data to secure storage
 */
export async function saveUser(user: {
  id: string
  email: string
  name: string
  image: string | null
}): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

/**
 * Retrieve user data from secure storage
 */
export async function getUser(): Promise<{
  id: string
  email: string
  name: string
  image: string | null
} | null> {
  const data = await SecureStore.getItemAsync(USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Clear all auth data (used during logout)
 */
export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ])
}
