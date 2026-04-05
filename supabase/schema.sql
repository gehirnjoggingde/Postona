-- ============================================================
-- POSTONA – Supabase Datenbankschema
-- Ausführen im Supabase SQL Editor: Dashboard → SQL Editor
-- ============================================================

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELLE: users
-- Erweitert die auth.users von Supabase Auth
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT '',
  linkedin_token TEXT,                     -- OAuth Access Token
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatisch User-Profil anlegen nach Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABELLE: style_profiles
-- Speichert den persönlichen Schreibstil des Nutzers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tone            TEXT NOT NULL DEFAULT 'professional'
                    CHECK (tone IN ('professional', 'casual', 'motivational', 'educational')),
  sentence_length TEXT NOT NULL DEFAULT 'medium'
                    CHECK (sentence_length IN ('short', 'medium', 'long')),
  emoji_usage     TEXT NOT NULL DEFAULT 'minimal'
                    CHECK (emoji_usage IN ('none', 'minimal', 'moderate', 'heavy')),
  sample_posts    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array von Beispiel-Posts
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- Jeder User hat genau ein Style-Profil
);

-- ============================================================
-- TABELLE: posts
-- Generierte und geplante LinkedIn-Posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  scheduled_at TIMESTAMPTZ,
  posted_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnelle Abfragen nach User + Status
CREATE INDEX IF NOT EXISTS posts_user_status_idx ON public.posts(user_id, status);
CREATE INDEX IF NOT EXISTS posts_scheduled_idx ON public.posts(scheduled_at) WHERE status = 'scheduled';

-- ============================================================
-- TABELLE: schedules
-- Automatische Post-Zeitpläne des Nutzers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,              -- z.B. "KI im Marketing"
  frequency   TEXT NOT NULL DEFAULT 'weekly'
                CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  post_time   TEXT NOT NULL DEFAULT '09:00',  -- Format: "HH:MM"
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELLE: subscriptions
-- Stripe-Abo-Status pro User
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT NOT NULL,
  plan                TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'pro', 'creator')),
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) – Jeder User sieht nur seine Daten
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: Nur eigenes Profil lesen/schreiben
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Style Profiles
CREATE POLICY "Users manage own style profile" ON public.style_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Users manage own posts" ON public.posts
  FOR ALL USING (auth.uid() = user_id);

-- Schedules
CREATE POLICY "Users manage own schedules" ON public.schedules
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users read own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- Subscriptions werden nur serverseitig via Service Role geschrieben (Stripe Webhook)

-- ============================================================
-- SCHEMA-ERWEITERUNGEN (Migration 2)
-- LinkedIn-Felder in users + Multi-Account-Tabelle
-- ============================================================

-- LinkedIn-Felder zur users-Tabelle hinzufügen
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linkedin_urn TEXT;

-- TABELLE: linkedin_accounts (Creator-Plan: bis zu 3 Accounts)
CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_name  TEXT NOT NULL,
  linkedin_urn  TEXT NOT NULL,               -- z.B. "urn:li:person:abc123"
  access_token  TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own linkedin accounts" ON public.linkedin_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Max. 1 Primary-Account pro User erzwingen
CREATE UNIQUE INDEX IF NOT EXISTS linkedin_accounts_primary_idx
  ON public.linkedin_accounts(user_id) WHERE is_primary = TRUE;
