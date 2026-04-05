// ============================================================
// GET /api/cron/auto-post  (Vercel Cron Job)
// Generiert täglich Posts für alle aktiven Schedules
// Berücksichtigt: interval_days, post_weekdays, use_weekly_brief
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface Schedule {
  id: string;
  user_id: string;
  topic: string;
  post_time: string;
  active: boolean;
  direction: string | null;
  website_url: string | null;
  interval_days: number;
  post_weekdays: string | null;
  use_weekly_brief: boolean;
  last_auto_posted_at: string | null;
}

interface StyleProfile {
  tone: string;
  sentence_length: string;
  emoji_usage: string;
  sample_posts: string[];
  dream_client: string | null;
  usp: string | null;
  industry_opinion: string | null;
  linkedin_goal: string | null;
}

// ── Prüfen ob Schedule heute posten soll ─────────────────────
function shouldPostToday(schedule: Schedule): boolean {
  const now = new Date();
  const todayWeekday = WEEKDAY_NAMES[now.getDay()];

  // Wochentag-Modus: spezifische Tage
  if (schedule.post_weekdays) {
    const days = schedule.post_weekdays.split(',').map(d => d.trim().toLowerCase());
    return days.includes(todayWeekday);
  }

  // Intervall-Modus: alle N Tage
  const intervalDays = schedule.interval_days ?? 1;
  if (intervalDays <= 1) return true; // täglich

  if (!schedule.last_auto_posted_at) return true; // noch nie gepostet

  const lastPosted = new Date(schedule.last_auto_posted_at);
  const daysSinceLast = Math.floor((now.getTime() - lastPosted.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceLast >= intervalDays;
}

// ── NewsAPI-Abfrage ───────────────────────────────────────────
async function fetchNewsForTopic(topic: string): Promise<string> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return 'Keine aktuellen News verfügbar.';

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=de&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return 'Keine aktuellen News verfügbar.';

    const data = await response.json();
    const articles: Array<{ title: string; description?: string }> = data.articles ?? [];
    if (articles.length === 0) return 'Keine aktuellen News gefunden.';

    return articles
      .map((a, i) => `${i + 1}. ${a.title}${a.description ? ` – ${a.description}` : ''}`)
      .join('\n');
  } catch {
    return 'News konnten nicht abgerufen werden.';
  }
}

// ── scheduled_at berechnen ────────────────────────────────────
function buildScheduledAt(postTime: string): string {
  const now = new Date();
  const [hours, minutes] = postTime.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0).toISOString();
}

// ── Handler ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('active', true);

    if (schedulesError) {
      return NextResponse.json({ error: 'Schedules konnten nicht geladen werden.' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ processed: 0, errors: [] }, { status: 200 });
    }

    for (const schedule of schedules as Schedule[]) {
      try {
        // Prüfen ob heute gepostet werden soll
        if (!shouldPostToday(schedule)) continue;

        // Style-Profil + Strategie laden
        const { data: styleData } = await supabase
          .from('style_profiles')
          .select('tone, sentence_length, emoji_usage, sample_posts, dream_client, usp, industry_opinion, linkedin_goal')
          .eq('user_id', schedule.user_id)
          .single();

        const profile = styleData as StyleProfile | null;

        // Strategie-Kontext aufbauen (nur wenn use_weekly_brief aktiv)
        const strategyLines = schedule.use_weekly_brief && profile ? [
          profile.dream_client && `Traumkunde: ${profile.dream_client}`,
          profile.usp && `Alleinstellungsmerkmal: ${profile.usp}`,
          profile.industry_opinion && `Branchenmeinung: ${profile.industry_opinion}`,
          profile.linkedin_goal && `LinkedIn-Ziel: ${profile.linkedin_goal}`,
        ].filter(Boolean) : [];

        const strategyContext = strategyLines.length > 0
          ? `\nStrategie-Kontext des Nutzers:\n${strategyLines.join('\n')}\n`
          : '';

        // News abrufen
        const newsHeadlines = await fetchNewsForTopic(schedule.topic);

        // Stil-Beschreibung
        const samplePostsText = profile?.sample_posts?.length
          ? profile.sample_posts.slice(0, 2).join(' | ')
          : '';

        const styleDescription = profile
          ? `Ton: ${profile.tone}, Satzlänge: ${profile.sentence_length}, Emoji-Nutzung: ${profile.emoji_usage}.${samplePostsText ? ` Beispiel-Posts: ${samplePostsText}` : ''}`
          : 'Professionell, klar und authentisch.';

        // Post mit Claude generieren
        const promptParts = [
          `Thema: ${schedule.topic}.`,
          `\nAktuelle News:\n${newsHeadlines}`,
          strategyContext,
          `\nStil-Profil: ${styleDescription}`,
          schedule.direction ? `\nTon & Richtung: ${schedule.direction}` : '',
          schedule.website_url ? `\nUnternehmen/Produkt: ${schedule.website_url} – natürlich und subtil erwähnen wenn thematisch passend.` : '',
          `\nSchreibe einen LinkedIn-Post der diese Infos aufgreift. Maximal 1300 Zeichen. Kein Markdown.`,
        ].filter(Boolean).join('');

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: 'Du bist ein Ghost-Writer für LinkedIn. Schreibe einen authentischen Post im Stil des Nutzers.',
          messages: [{ role: 'user', content: promptParts }],
        });

        const generatedContent = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
        if (!generatedContent) throw new Error('Claude hat keinen Content zurückgegeben.');

        // Post in Supabase speichern
        const { error: insertError } = await supabase.from('posts').insert({
          user_id: schedule.user_id,
          content: generatedContent,
          status: 'scheduled',
          scheduled_at: buildScheduledAt(schedule.post_time),
        });

        if (insertError) throw new Error(`Supabase insert Fehler: ${insertError.message}`);

        // last_auto_posted_at aktualisieren
        await supabase
          .from('schedules')
          .update({ last_auto_posted_at: new Date().toISOString() })
          .eq('id', schedule.id);

        processed++;
      } catch (scheduleError) {
        const msg = `Schedule ${schedule.id} (${schedule.topic}): ${
          scheduleError instanceof Error ? scheduleError.message : String(scheduleError)
        }`;
        console.error('[auto-post]', msg);
        errors.push(msg);
      }
    }

    return NextResponse.json({ processed, errors }, { status: 200 });
  } catch (error) {
    console.error('[auto-post] Allgemeiner Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler.', processed, errors },
      { status: 500 }
    );
  }
}
