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
  // Strategie-Felder (optional)
  dream_client: string | null;
  usp: string | null;
  industry_opinion: string | null;
  linkedin_goal: string | null;
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
  topic: string;
  frequency: 'daily' | 'weekly' | 'biweekly'; // legacy
  post_time: string;           // Format: "HH:MM"
  active: boolean;
  direction: string | null;
  website_url: string | null;
  interval_days: number;       // 1=täglich, 2=alle 2 Tage, 7=wöchentlich
  post_weekdays: string | null; // z.B. "monday,wednesday,friday" oder null
  use_weekly_brief: boolean;   // Strategy-Kontext aus Weekly Brief einbeziehen
  with_image: boolean;         // Bild generieren (coming soon)
  last_auto_posted_at: string | null;
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
