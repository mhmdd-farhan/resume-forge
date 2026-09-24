// Central environment-derived configuration.
//
// Public site URL resolution:
//   1. NEXT_APP_URL        (preferred) — regular server env var
//   2. NEXT_PUBLIC_APP_URL (fallback)  — standard Next.js client-visible prefix
//   3. SITE_URL            (last resort) so the app never breaks when neither
//      is set (used only for metadata/SEO; NOT for payment redirects — the
//      checkout route validates the env explicitly instead).
export const SITE_URL = "https://resumeforge.com";

export const APP_URL =
  process.env.NEXT_APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  SITE_URL;

// Explicitly-configured public URL (no placeholder fallback). Empty string
// when the operator has not set either env var — callers that need a REAL
// URL (e.g. Midtrans notification_url) must treat "" as misconfiguration.
export const CONFIGURED_APP_URL =
  process.env.NEXT_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";