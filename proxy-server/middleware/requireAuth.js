import { getSupabase } from '../lib/supabase.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export default async function requireAuth(req, res, next) {
  try {
    // DEMO_MODE: bypass Supabase auth, allow any token (or no token)
    if (env.DEMO_MODE) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      req.user = { id: 'demo-user-id', email: 'demo@pagepal.ai', user_metadata: {} };
      const demoPlan = req.headers['x-demo-plan'] || 'free';
      req.userPlan = {
        plan: demoPlan,
        daily_summaries: 0,
        daily_chats: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
        stripe_customer_id: null,
      };
      req.isDemo = true;
      return next();
    }

    const supabase = getSupabase();
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;

    // Check and enforce plan limits
    const { data: planData, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!planData) {
      // Create a free plan for new users
      try {
        await supabase.from('user_plans').insert({
          user_id: data.user.id,
          plan: 'free',
          daily_summaries: 0,
          daily_chats: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
        });
      } catch (insertErr) {
        logger.warn('Failed to insert new user_plans row', { error: insertErr.message });
      }
      req.userPlan = { plan: 'free', daily_summaries: 0, daily_chats: 0 };
    } else {
      // Reset daily counters if date changed
      const today = new Date().toISOString().split('T')[0];
      if (planData.last_reset_date !== today) {
        try {
          await supabase
            .from('user_plans')
            .update({ daily_summaries: 0, daily_chats: 0, last_reset_date: today })
            .eq('user_id', data.user.id);
          planData.daily_summaries = 0;
          planData.daily_chats = 0;
        } catch (resetErr) {
          logger.warn('Failed to reset daily counters', { error: resetErr.message });
        }
      }
      req.userPlan = planData;
    }

    next();
  } catch (err) {
    logger.error('Auth middleware exception', { error: err.message });
    res.status(500).json({ error: 'Authentication failed' });
  }
}
