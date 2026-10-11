/**
 * Google Sheets client for Cloudflare (Workers / Pages Functions): same call shape as the googleapis client that
 * lib/sheetsTools.ts uses on Replit, implemented with fetch + WebCrypto. Swapped in for ./sheets.js at bundle time.
 *
 * Credentials (Cloudflare Pages -> Settings -> Variables and Secrets), either:
 *   GOOGLE_SERVICE_ACCOUNT_JSON   the whole service-account key JSON. New sheets are owned by the service account and
 *                                 shared "anyone with the link can edit" so visitors can open them and run the add-on.
 *   or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN   OAuth for your own Google account (sheets land
 *                                 in your Drive, like on Replit).
 */
type Env = Record<string, string | undefined>;
let ENV: Env = {};
let cached: { token: string; exp: number; sa: boolean } | null = null;

export function configureGoogle(env: Env) { ENV = env || {}; }

const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data as ArrayBuffer);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function saToken(json: string): Promise<{ token: string; exp: number }> {
  const key = JSON.parse(json) as { client_email: string; private_key: string; token_uri?: string };
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPES, aud: key.token_uri || "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = key.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, new TextEncoder().encode(`${head}.${claim}`));
  const r = await fetch(key.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${b64url(sig)}` }),
  });
  const j: any = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`Google sign-in failed (service account): ${j.error_description || j.error || r.status}`);
  return { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
}

async function refreshToken(): Promise<{ token: string; exp: number }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: ENV.GOOGLE_CLIENT_ID!, client_secret: ENV.GOOGLE_CLIENT_SECRET!,
      refresh_token: ENV.GOOGLE_REFRESH_TOKEN! }),
  });
  const j: any = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`Google sign-in failed (refresh token): ${j.error_description || j.error || r.status}`);
  return { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
}

async function accessToken(): Promise<{ token: string; sa: boolean }> {
  if (cached && cached.exp > Date.now()) return cached;
  if (ENV.GOOGLE_SERVICE_ACCOUNT_JSON) cached = { ...(await saToken(ENV.GOOGLE_SERVICE_ACCOUNT_JSON)), sa: true };
  else if (ENV.GOOGLE_REFRESH_TOKEN && ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) cached = { ...(await refreshToken()), sa: false };
  else throw new Error("Google Sheets is not connected on this server yet (set GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN).");
  return cached;
}

async function g(method: string, url: string, body?: unknown): Promise<any> {
  const { token } = await accessToken();
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); const j = text ? JSON.parse(text) : {};
  if (!r.ok) throw new Error(`Google API ${r.status}: ${j.error?.message || text.slice(0, 200)}`);
  return j;
}

const S = "https://sheets.googleapis.com/v4/spreadsheets";
const q = (o: Record<string, string | undefined>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined) as [string, string][]).toString();

export async function getUncachableGoogleSheetClient() {
  return {
    spreadsheets: {
      async create({ requestBody }: any) {
        const data = await g("POST", S, requestBody);
        const { sa } = await accessToken();
        if (sa && data.spreadsheetId)        // service-account sheets are invisible to people until shared
          await g("POST", `https://www.googleapis.com/drive/v3/files/${data.spreadsheetId}/permissions?supportsAllDrives=true`,
            { role: "writer", type: "anyone", allowFileDiscovery: false });
        return { data };
      },
      async get({ spreadsheetId }: any) { return { data: await g("GET", `${S}/${encodeURIComponent(spreadsheetId)}`) }; },
      async batchUpdate({ spreadsheetId, requestBody }: any) { return { data: await g("POST", `${S}/${encodeURIComponent(spreadsheetId)}:batchUpdate`, requestBody) }; },
      values: {
        async get({ spreadsheetId, range, valueRenderOption }: any) {
          return { data: await g("GET", `${S}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?${q({ valueRenderOption })}`) };
        },
        async update({ spreadsheetId, range, valueInputOption, requestBody }: any) {
          return { data: await g("PUT", `${S}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?${q({ valueInputOption })}`, requestBody) };
        },
      },
    },
  };
}
