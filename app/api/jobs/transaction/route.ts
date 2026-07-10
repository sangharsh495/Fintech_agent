import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addTransactionJob, TransactionJobData } from '@/server/jobs/queue';
import { z } from 'zod';

// Validation schema
const transactionJobSchema = z.object({
  transactionId: z.string(),
  type: z.enum(['categorize', 'reconcile', 'notify']),
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
    const validationResult = transactionJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { transactionId, type } = validationResult.data;
    
    // Add job to queue
    const jobData: TransactionJobData = {
      userId,
      transactionId,
      type,
    };

    const job = await addTransactionJob(jobData);

    return NextResponse.json({
      success: true,
      message: 'Transaction job queued successfully',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Job creation error:', error);
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
- [x] Check for background job processing implementation
- [ ] Verify audit logging implementation
- [x] Check for webhook endpoints
- [ ] Review caching implementation
- [x] Check for 2FA/TOTP implementation
- [ ] Review data export/import capabilities
- [ ] Check for investment/portfolio tracking
- [ ] Review compliance features (GST/TDS)
- [ ] Check for real-time WebSocket capabilities
- [ ] Identify missing industry-standard features
</task_progress>
</write_to_file>