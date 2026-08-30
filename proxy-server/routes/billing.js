import { Router } from 'express';
import Stripe from 'stripe';
import { env } from '../lib/env.js';
import { getSupabase } from '../lib/supabase.js';
import requireAuth from '../middleware/requireAuth.js';

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
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/billing/create-portal', requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!req.userPlan.stripe_customer_id) return res.status(400).json({ error: 'No customer' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: req.userPlan.stripe_customer_id,
      return_url: `${env.FRONTEND_URL}/`,
    });
    res.json({ url: portal.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook — must be mounted with raw body, handled in index.js separately for prod
// This route is for JSON fallback (not used for signature verification)
router.get('/api/billing/status', requireAuth, async (req, res) => {
  res.json({ plan: req.userPlan.plan, daily_summaries: req.userPlan.daily_summaries, daily_chats: req.userPlan.daily_chats });
});

export default router;

// Webhook handler exported for index.js raw body
export async function handleStripeWebhook(req, res) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook sig fail:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabase = getSupabase();
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id || session.client_reference_id;
        if (userId) {
          await supabase.from('user_plans').update({
            plan: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }).eq('user_id', userId);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status; // active, past_due, etc.
        const plan = status === 'active' || status === 'trialing' ? 'pro' : 'free';
        await supabase.from('user_plans').update({
          plan,
          stripe_subscription_id: sub.id,
        }).eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase.from('user_plans').update({
          plan: 'free',
          stripe_subscription_id: null,
        }).eq('stripe_customer_id', sub.customer);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
