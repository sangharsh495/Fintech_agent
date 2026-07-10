import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TOTPService } from '@/server/services/auth/totp.service';
import { z } from 'zod';

const verifyTotpSchema = z.object({
  token: z.string().length(6, 'Invalid token length'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
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
    console.error('MFA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}