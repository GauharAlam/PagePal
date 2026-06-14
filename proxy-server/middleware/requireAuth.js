import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function requireAuth(req, res, next) {
  try {
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
      await supabase.from('user_plans').insert({
        user_id: data.user.id,
        plan: 'free',
        daily_summaries: 0,
        daily_chats: 0,
        last_reset_date: new Date().toISOString().split('T')[0]
      });
      req.userPlan = { plan: 'free', daily_summaries: 0, daily_chats: 0 };
    } else {
      // Reset daily counters if date changed
      const today = new Date().toISOString().split('T')[0];
      if (planData.last_reset_date !== today) {
        await supabase
          .from('user_plans')
          .update({ daily_summaries: 0, daily_chats: 0, last_reset_date: today })
          .eq('user_id', data.user.id);
        planData.daily_summaries = 0;
        planData.daily_chats = 0;
      }
      req.userPlan = planData;
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
