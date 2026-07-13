import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { safeLogError } from '@/server/lib/safe-log';
import { addTransactionJob, TransactionJobData } from '@/server/jobs/queue';
import { z } from 'zod';

// Validation schema
const transactionJobSchema = z.object({
  transactionId: z.string(),
  type: z.enum(['categorize', 'reconcile', 'notify']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
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
    safeLogError('Job creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}