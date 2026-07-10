import speakeasy from 'speakeasy';
import { db } from '@/server/db';
import { userTotpSecrets, user2faBackupCodes } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export class TOTPService {
  /**
   * Generate a new TOTP secret for a user
   */
  static async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `FintechApp:${userId}`,
    });

    // Store the secret temporarily (user must verify before it's activated)
    await db.insert(userTotpSecrets)
      .values({
        userId,
        secret: secret.base32,
        isVerified: false,
      })
      .onConflictDoUpdate({
        target: userTotpSecrets.userId,
        set: {
          secret: secret.base32,
          isVerified: false,
        }
      });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Verify a TOTP token for a user
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    const [userSecret] = await db
      .select()
      .from(userTotpSecrets)
      .where(eq(userTotpSecrets.userId, userId));

    if (!userSecret || !userSecret.secret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: userSecret.secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 time step before and after
    });

    if (verified && !userSecret.isVerified) {
      // Mark as verified on first successful verification
      await db
        .update(userTotpSecrets)
        .set({ isVerified: true })
        .where(eq(userTotpSecrets.userId, userId));
    }

    return verified;
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string) {
    await db.delete(userTotpSecrets).where(eq(userTotpSecrets.userId, userId));
  }

  /**
   * Check if 2FA is enabled and verified for a user
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const [userSecret] = await db
      .select()
      .from(userTotpSecrets)
      .where(eq(userTotpSecrets.userId, userId));

    return !!userSecret?.isVerified;
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  static async generateBackupCodes(userId: string): Promise<string[]> {
    // Generate 8 backup codes, each 8 characters long
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Hash and store the codes
    const hashedCodes = codes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    await db.delete(user2faBackupCodes).where(eq(user2faBackupCodes.userId, userId));

    await db.insert(user2faBackupCodes).values(
      codes.map((code, index) => ({
        userId,
        code: hashedCodes[index],
        used: false,
      }))
    );

    return codes;
  }

  /**
   * Verify a backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const hashedCode = crypto
      .createHash('sha256')
      .update(code.toUpperCase())
      .digest('hex');

    const [backupCode] = await db
      .select()
      .from(user2faBackupCodes)
      .where(
        and(
          eq(user2faBackupCodes.userId, userId),
          eq(user2faBackupCodes.code, hashedCode),
          eq(user2faBackupCodes.used, false)
        )
      )
      .limit(1);

    if (backupCode) {
      // Mark as used
      await db
        .update(user2faBackupCodes)
        .set({ used: true })
        .where(eq(user2faBackupCodes.id, backupCode.id));
      return true;
    }

    return false;
  }
}