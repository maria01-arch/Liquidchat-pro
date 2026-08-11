/**
 * Pigion — Supabase client
 *
 * Auth model: Pigion does NOT use Supabase's built-in email/password auth.
 * Accounts are keyed by a locally-generated BIP39 passphrase (see
 * src/utils/wallet.ts). The passphrase deterministically derives a keypair;
 * the public key becomes the account identity. To authenticate, the client
 * signs a server-issued challenge and exchanges it for a short-lived JWT via
 * the `wallet-auth` Edge Function (supabase/functions/wallet-auth) — see
 * src/utils/auth.ts for the flow.
 *
 * This uses Supabase's "third-party auth" support: passing an `accessToken`
 * callback lets PostgREST/Realtime/Storage authenticate every request with
 * our own JWT instead of a Supabase GoTrue session, so `auth.uid()` in RLS
 * policies resolves to the `sub` claim we set (== public.users.id).
 */
import { createClient } from '@supabase/supabase-js';
import { getAuthToken } from './authToken';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Pigion] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Set them in your .env file — see .env.example.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  accessToken: async () => getAuthToken() ?? undefined,
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
