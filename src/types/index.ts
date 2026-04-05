// ============================================================
// POSTONA – Zentrale TypeScript-Typen
// Entsprechen 1:1 dem Supabase-Datenbankschema
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  linkedin_token: string | null;
  linkedin_token_expires_at: string | null;
  linkedin_urn: string | null;
  created_at: string;
}

export interface LinkedInAccount {
  id: string;
  user_id: string;
  account_name: string;
  linkedin_urn: string;
  access_token: string;
  expires_at: string;
  is_primary: boolean;
  created_at: string;
}

export interface PostVariant {
  variant: number;
  content: string;
}

export interface StyleProfile {
  id: string;
  user_id: string;
  tone: 'professional' | 'casual' | 'motivational' | 'educational';
  sentence_length: 'short' | 'medium' | 'long';
  emoji_usage: 'none' | 'minimal' | 'moderate' | 'heavy';
  sample_posts: string[]; // Array von Beispiel-Posts des Nutzers
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  scheduled_at: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  topic: string;          // z.B. "KI im Marketing", "Leadership"
  frequency: 'daily' | 'weekly' | 'biweekly';
  post_time: string;      // Format: "HH:MM" z.B. "09:00"
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  plan: 'free' | 'pro' | 'creator';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  created_at: string;
}

// Pricing-Pläne (statische Konfiguration)
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month';
  features: string[];
  cta: string;
  highlighted: boolean;
  stripePriceId: string | null;
}
