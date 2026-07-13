import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { TOTPService } from '@/server/services/auth/totp.service';
import { safeLogError } from '@/server/lib/safe-log';
import { authRateLimiter } from '@/server/lib/rate-limit';

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
    
    // Disable 2FA for the user
    await TOTPService.disable2FA(userId);

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    safeLogError('MFA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}