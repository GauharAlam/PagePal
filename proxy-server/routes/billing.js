import { Router } from 'express';
import Stripe from 'stripe';
import { env } from '../lib/env.js';
import { getSupabase } from '../lib/supabase.js';
import requireAuth from '../middleware/requireAuth.js';
import { logger } from '../lib/logger.js';

const router = Router();

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(env.STRIPE_SECRET_KEY);
}

// Create checkout session — Pro $9/mo
router.post('/api/billing/create-checkout', requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();

    if (!env.STRIPE_PRO_PRICE_ID) {
      return res.status(500).json({ error: 'Stripe price not configured' });
    }

    // Ensure stripe_customer_id exists
    let customerId = req.userPlan.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { supabase_user_id: req.user.id },
      });
      customerId = customer.id;
      await supabase.from('user_plans').update({ stripe_customer_id: customerId }).eq('user_id', req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/billing/cancel`,
      metadata: { supabase_user_id: req.user.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error('Checkout error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/billing/create-portal', requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!req.userPlan.stripe_customer_id) return res.status(400).json({ error: 'No active Stripe customer found' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: req.userPlan.stripe_customer_id,
      return_url: `${env.FRONTEND_URL}/`,
    });
    res.json({ url: portal.url });
  } catch (err) {
    logger.error('Portal error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/billing/status', requireAuth, async (req, res) => {
  res.json({
    plan: req.userPlan.plan,
    daily_summaries: req.userPlan.daily_summaries,
    daily_chats: req.userPlan.daily_chats,
  });
});

export default router;

// Webhook handler with idempotency check
export async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let supabase = null;
  try { supabase = getSupabase(); } catch {}

  if (supabase) {
    // Idempotency: Check if this event was already processed
    const { data: existing } = await supabase
      .from('processed_stripe_events')
      .select('event_id')
      .eq('event_id', event.id)
      .single();

    if (existing) {
      logger.info('Stripe event already processed, skipping', { eventId: event.id });
      return res.json({ received: true, already_processed: true });
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id || session.client_reference_id;
        if (userId && supabase) {
          await supabase.from('user_plans').update({
            plan: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;
        const plan = status === 'active' || status === 'trialing' ? 'pro' : 'free';
        if (supabase) {
          await supabase.from('user_plans').update({
            plan,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', customerId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (supabase) {
          await supabase.from('user_plans').update({
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('stripe_customer_id', sub.customer);
        }
        break;
      }
    }

    // Record event as processed for idempotency
    if (supabase) {
      await supabase.from('processed_stripe_events').insert({
        event_id: event.id,
        event_type: event.type,
      });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook handler execution error', { error: err.message, eventId: event.id });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
