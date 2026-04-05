import { SupabaseClient } from '@supabase/supabase-js';
import { PLAN_LIMITS } from '@/lib/stripe';

export type Plan = 'free' | 'pro' | 'creator';

export async function getUserPlan(
  userId: string,
  supabase: SupabaseClient
): Promise<Plan> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single();

  if (error || !data || data.status !== 'active') {
    return 'free';
  }

  const plan = data.plan as Plan;
  if (!['free', 'pro', 'creator'].includes(plan)) {
    return 'free';
  }

  return plan;
}

export async function checkPostLimit(
  userId: string,
  supabase: SupabaseClient
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan = await getUserPlan(userId, supabase);
  const limit = PLAN_LIMITS[plan].postsPerMonth;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth);

  if (error) {
    return { allowed: false, used: 0, limit: limit === Infinity ? -1 : limit };
  }

  const used = count ?? 0;

  return {
    allowed: limit === Infinity || used < limit,
    used,
    limit: limit === Infinity ? -1 : limit,
  };
}
