import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/server/db/client';

// Initialize Stripe (in practice, use environment variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const buf = await request.text();
  const sig = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      await handlePaymentMethodAttached(paymentMethod);
      break;
    case 'charge.refunded':
      const charge = event.data.object as Stripe.Charge;
      await handleRefund(charge);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription, event.type);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  // Update payment status in your database
  // This is a simplified example - you'd want to map Stripe payment intents to your internal transactions
  try {
    // Example: Update invoice/payment record
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'completed',
        processedAt: new Date(),
      }
    });
    
    console.log(`✅ Payment ${paymentIntent.id} marked as successful`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    // In production, you might want to retry or alert
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  // Attach payment method to customer/user
  try {
    if (paymentMethod.customer) {
      // Link Stripe customer to your user
      await prisma.user.updateMany({
        where: { stripeCustomerId: paymentMethod.customer as string },
        data: {
          stripePaymentMethodId: paymentMethod.id,
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  // Handle refunded payments
  try {
    await prisma.payment.updateMany({
      where: { stripeChargeId: charge.id },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
      }
    });
    
    console.log(`↩️ Refund processed for charge ${charge.id}`);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  eventType: string
) {
  // Handle subscription lifecycle events
  try {
    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!user) return;

    switch (eventType) {
      case 'customer.subscription.created':
        await prisma.userSubscription.create({
          data: {
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        });
        break;
        
      case 'customer.subscription.updated':
        await prisma.userSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        });
        break;
        
      case 'customer.subscription.deleted':
        await prisma.userSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            endedAt: new Date(),
          }
        });
        break;
    }
    
    console.log(`🔄 Subscription ${subscription.id} updated: ${eventType}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}
</task_progress>
- [x] Explore project structure and backend files
- [x] Analyze authentication
- [x] Check for rate limiting and security middleware
- [ ] Verify API documentation completeness
- [ ] Check for background job processing implementation
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