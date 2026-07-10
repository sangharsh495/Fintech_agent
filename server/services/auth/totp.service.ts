import { speakeasy } from 'speakeasy';
import { prisma } from '@/server/db/client';

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
    await prisma.userTOTPSecret.upsert({
      where: { userId },
      update: {
        secret: secret.base32,
        isVerified: false,
      },
      create: {
        userId,
        secret: secret.base32,
        isVerified: false,
      },
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
    const userSecret = await prisma.userTOTPSecret.findUnique({
      where: { userId },
    });

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
      await prisma.userTOTPSecret.update({
        where: { userId },
        data: { isVerified: true },
      });
    }

    return verified;
  }

  /**
   * Disable 2FA for a user
   */
  static async disable2FA(userId: string) {
    await prisma.userTOTPSecret.delete({
      where: { userId },
    });
  }

  /**
   * Check if 2FA is enabled and verified for a user
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    const userSecret = await prisma.userTOTPSecret.findUnique({
      where: { userId },
    });

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

    // Hash and store the codes (in practice, you'd bcrypt these)
    const hashedCodes = codes.map(code => 
      require('crypto').createHash('sha256').update(code).digest('hex')
    );

    await prisma.user2FABackupCodes.deleteMany({
      where: { userId }
    });

    await prisma.user2FABackupCodes.createMany({
      data: codes.map((code, index) => ({
        userId,
        code: hashedCodes[index],
        used: false,
      }))
    });

    return codes;
  }

  /**
   * Verify a backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const hashedCode = require('crypto')
      .createHash('sha256')
      .update(code.toUpperCase())
      .digest('hex');

    const backupCode = await prisma.user2FABackupCodes.findFirst({
      where: {
        userId,
        code: hashedCode,
        used: false,
      }
    });

    if (backupCode) {
      // Mark as used
      await prisma.user2FABackupCodes.update({
        where: { id: backupCode.id },
        data: { used: true },
      });
      return true;
    }

    return false;
  }
}