-- Migration: Autopilot direction + website_url Felder
-- Ausführen im Supabase SQL Editor

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS direction TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;
