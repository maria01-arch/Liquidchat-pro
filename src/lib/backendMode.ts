/**
 * Pigion runs in one of two modes:
 *
 *  - "demo"  — no Supabase project configured (VITE_SUPABASE_URL/ANON_KEY
 *              missing). The app falls back to local mock data so it's
 *              still fully explorable without any setup.
 *  - "live"  — Supabase is configured. Chats/messages are fetched from and
 *              written to the real backend, and direct-message content is
 *              genuinely end-to-end encrypted (see src/services/chatService.ts).
 *
 * Auth (wallet-auth edge function) always requires a real Supabase project
 * regardless of this flag — sign up / log in will surface a clear error if
 * the backend isn't configured, rather than a confusing network failure.
 */
export const isBackendConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
