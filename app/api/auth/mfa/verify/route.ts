import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { TOTPService } from '@/server/services/auth/totp.service';
import { z } from 'zod';
import { safeLogError } from '@/server/lib/safe-log';
import { authRateLimiter } from '@/server/lib/rate-limit';

const verifyTotpSchema = z.object({
  token: z.string().length(6, 'Invalid token length'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting check
    const rateLimit = await authRateLimiter.check(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetMs / 1000 / 60)} minutes.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = verifyTotpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;
    
    // Verify the TOTP token
    const isVerified = await TOTPService.verifyToken(userId, token);
    
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Generate backup codes
    const backupCodes = await TOTPService.generateBackupCodes(userId);

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes, // Return backup codes for user to save
    });
  } catch (error) {
    safeLogError('MFA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}