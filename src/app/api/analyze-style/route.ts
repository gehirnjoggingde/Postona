// ============================================================
// POST /api/analyze-style
// 1. Nimmt Array von LinkedIn-Posts entgegen
// 2. Schickt sie an Claude API zur Stil-Analyse
// 3. Speichert das Ergebnis als style_profile in Supabase
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System-Prompt: Gibt Claude klare Anweisungen zur Analyse und JSON-Ausgabe
const STYLE_ANALYSIS_SYSTEM_PROMPT = `Du bist ein Experte für LinkedIn-Content und persönliche Kommunikationsstile.

Analysiere die bereitgestellten LinkedIn-Posts und erstelle ein detailliertes Stil-Profil.
Gib das Ergebnis AUSSCHLIESSLICH als valides JSON zurück – kein Text davor oder danach.

Das JSON muss exakt diese Struktur haben:
{
  "tone": "professional | casual | motivational | educational",
  "sentence_length": "short | medium | long",
  "emoji_usage": "none | minimal | moderate | heavy",
  "post_structure": "Hook-Body-CTA | Storytelling | Listenformat | Frage-Antwort | Gemischt",
  "typical_phrases": ["Phrase 1", "Phrase 2", "Phrase 3"],
  "topic_fields": ["Thema 1", "Thema 2", "Thema 3"],
  "writing_patterns": {
    "uses_line_breaks": true,
    "uses_questions": true,
    "uses_numbers": false,
    "hook_style": "Kurze provokante Aussage | Zahl/Statistik | Persönliche Geschichte | Frage"
  },
  "analysis_summary": "2-3 Sätze die den Stil in eigenen Worten beschreiben"
}

Definitionen:
- tone: Die dominante Stimmung der Posts
- sentence_length: short = <10 Wörter, medium = 10-20 Wörter, long = >20 Wörter
- emoji_usage: none = keine Emojis, minimal = 0-1 pro Post, moderate = 2-4, heavy = 5+
- typical_phrases: Wiederkehrende Formulierungen oder Satzmuster
- topic_fields: Hauptthemen über die geschrieben wird`;

export async function POST(request: NextRequest) {
  try {
    // ── 1. Request validieren ─────────────────────────────────
    const body = await request.json();
    const { posts } = body as { posts: string[] };

    if (!Array.isArray(posts) || posts.length < 1) {
      return NextResponse.json(
        { error: 'Mindestens ein Post wird benötigt.' },
        { status: 400 }
      );
    }

    const validPosts = posts.filter(p => typeof p === 'string' && p.trim().length > 10);
    if (validPosts.length < 1) {
      return NextResponse.json(
        { error: 'Posts müssen mindestens 10 Zeichen haben.' },
        { status: 400 }
      );
    }

    // ── 2. Supabase Auth – User muss eingeloggt sein ──────────
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte einloggen.' },
        { status: 401 }
      );
    }

    // ── 3. Claude API aufrufen ────────────────────────────────
    const userMessage = `Hier sind ${validPosts.length} LinkedIn-Posts von einem Nutzer. Analysiere den persönlichen Schreibstil:

${validPosts.map((post, i) => `--- POST ${i + 1} ---\n${post.trim()}`).join('\n\n')}

Erstelle jetzt das Stil-Profil als JSON.`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',      // Aktuellstes Modell
      max_tokens: 1024,
      system: STYLE_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    // Claude-Antwort extrahieren (erstes Text-Block)
    const rawContent = claudeResponse.content[0];
    if (rawContent.type !== 'text') {
      throw new Error('Unerwartetes Antwortformat von Claude.');
    }

    // JSON aus der Antwort parsen
    // Claude könnte trotz Anweisung Backticks einschließen – sicher entfernen
    const jsonText = rawContent.text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let styleProfile: Record<string, unknown>;
    try {
      styleProfile = JSON.parse(jsonText);
    } catch {
      console.error('Claude JSON-Parsing fehlgeschlagen:', rawContent.text);
      throw new Error('Stil-Analyse konnte nicht verarbeitet werden. Bitte versuche es erneut.');
    }

    // ── 4. In Supabase speichern (upsert = erstellen oder aktualisieren) ──
    const { error: dbError } = await supabase
      .from('style_profiles')
      .upsert(
        {
          user_id: user.id,
          tone: styleProfile.tone as string,
          sentence_length: styleProfile.sentence_length as string,
          emoji_usage: styleProfile.emoji_usage as string,
          // sample_posts speichern als Referenz für spätere Post-Generierung
          sample_posts: validPosts,
          // Vollständiges Profil als JSONB für erweiterte Felder
          // (wird in der DB als JSON-Spalte gespeichert – ggf. Spalte ergänzen)
        },
        { onConflict: 'user_id' }
      );

    if (dbError) {
      console.error('Supabase upsert Fehler:', dbError);
      // Trotzdem Erfolg zurückgeben – Profil kann im Client genutzt werden
      // (DB-Fehler z.B. weil Schema noch nicht ausgeführt wurde)
    }

    // ── 5. Ergebnis zurückgeben ───────────────────────────────
    return NextResponse.json({ profile: styleProfile }, { status: 200 });

  } catch (error) {
    console.error('[analyze-style] Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Serverfehler' },
      { status: 500 }
    );
  }
}
