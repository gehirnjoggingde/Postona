// ============================================================
// LinkedIn API Hilfsfunktionen
// Permissions: openid, profile, email, w_member_social
// ============================================================

export const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

export const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
export const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
export const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// ── getLinkedInAuthUrl ────────────────────────────────────────
// Baut die Authorization URL für den OAuth 2.0 Flow zusammen
export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    state,
    scope: LINKEDIN_SCOPES,
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

// ── exchangeCodeForToken ──────────────────────────────────────
// Tauscht den Authorization Code gegen einen Access Token
export async function exchangeCodeForToken(
  code: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn Token Exchange fehlgeschlagen: ${error}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Kein Access Token in LinkedIn-Antwort');
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in ?? 5183944, // ~60 Tage Default
  };
}

// ── getLinkedInProfile ────────────────────────────────────────
// Holt das User-Profil via OpenID Connect UserInfo Endpoint
export async function getLinkedInProfile(
  accessToken: string
): Promise<{ sub: string; name: string; email: string }> {
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn Profil-Abruf fehlgeschlagen: ${error}`);
  }

  const data = await response.json();

  if (!data.sub) {
    throw new Error('Kein sub (Member ID) in LinkedIn UserInfo-Antwort');
  }

  return {
    sub: data.sub,
    name: data.name ?? data.given_name ?? 'Unbekannt',
    email: data.email ?? '',
  };
}

// ── postToLinkedIn ────────────────────────────────────────────
// Veröffentlicht einen Text-Post via UGC Posts API
export async function postToLinkedIn(
  accessToken: string,
  authorUrn: string,
  content: string
): Promise<{ id: string }> {
  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn Post fehlgeschlagen: ${error}`);
  }

  const data = await response.json();

  // LinkedIn gibt die Post-ID im Header "X-RestLi-Id" oder im Body zurück
  const postId =
    data.id ??
    response.headers.get('x-restli-id') ??
    response.headers.get('X-RestLi-Id') ??
    '';

  return { id: postId };
}

// ── isTokenExpiringSoon ───────────────────────────────────────
// Gibt true zurück wenn der Token in weniger als 7 Tagen abläuft
export function isTokenExpiringSoon(expiresAt: string): boolean {
  const expiryDate = new Date(expiresAt);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return expiryDate <= sevenDaysFromNow;
}
