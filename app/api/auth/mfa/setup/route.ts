import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TOTPService } from '@/server/services/auth/totp.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check if 2FA is already enabled
    const is2FAEnabled = await TOTPService.is2FAEnabled(userId);
    if (is2FAEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate new TOTP secret
    const { secret, otpauthUrl } = await TOTPService.generateSecret(userId);

    return NextResponse.json({
      secret,
      otpauthUrl, // This can be used to generate QR code
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}