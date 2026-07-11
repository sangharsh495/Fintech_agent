import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/server/db';
import { users, payments, userSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe (in practice, use environment variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

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
  try {
    await db.update(payments)
      .set({
        status: 'completed',
        processedAt: new Date(),
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id));
    
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
      await db.update(users)
        .set({
          stripePaymentMethodId: paymentMethod.id,
        })
        .where(eq(users.stripeCustomerId, paymentMethod.customer as string));
    }
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  // Handle refunded payments
  try {
    await db.update(payments)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
      })
      .where(eq(payments.stripeChargeId, charge.id));
    
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, subscription.customer as string))
      .limit(1);

    if (!user) return;

    switch (eventType) {
      case 'customer.subscription.created':
        await db.insert(userSubscriptions).values({
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        });
        break;
        
      case 'customer.subscription.updated':
        await db.update(userSubscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
        break;
        
      case 'customer.subscription.deleted':
        await db.update(userSubscriptions)
          .set({
            status: 'canceled',
            endedAt: new Date(),
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
        break;
    }
    
    console.log(`🔄 Subscription ${subscription.id} updated: ${eventType}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}