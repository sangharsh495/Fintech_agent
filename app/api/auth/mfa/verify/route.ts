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
</task_progress>
- [x] Explore project structure and backend files
- [x] Analyze authentication
- [x] Check for rate limiting and security middleware
- [ ] Verify API documentation completeness
- [ ] Check for background job processing implementation
- [ ] Verify audit logging implementation
- [ ] Check for webhook endpoints
- [ ] Review caching implementation
- [x] Check for 2FA/TOTP implementation
- [ ] Review data export/import capabilities
- [ ] Check for investment/portfolio tracking
- [ ] Review compliance features (GST/TDS)
- [ ] Check for real-time WebSocket capabilities
- [ ] Identify missing industry-standard features
</task_progress>
</write_to_file>