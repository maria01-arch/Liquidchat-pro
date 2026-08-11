// Pigion — wallet-auth Edge Function
//
// Two-step challenge/response so a stolen public key alone can never be
// used to log in — the caller must prove they hold the matching Ed25519
// secret key (derived from their 12-word phrase) by signing a one-time
// server-issued nonce.
//
//   POST { action: "challenge", signingPublicKey }
//     -> { nonce }
//
//   POST { action: "verify", signingPublicKey, encryptionPublicKey,
//          signature, nonce, username?, avatarUrl? }
//     -> { token, expiresIn, user }
//
// Deploy with: supabase functions deploy wallet-auth
// Required secrets (supabase secrets set ...):
//   WALLET_JWT_SECRET     (Project Settings -> API -> JWT Keys -> Legacy JWT Secret)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-provided by Supabase)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ed25519 } from 'https://esm.sh/@noble/curves@1.6.0/ed25519';
import * as jose from 'https://esm.sh/jose@5.9.6';

const CHALLENGE_TTL_SECONDS = 120;
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour — client re-authenticates silently before this expires

// Required for browser calls: without these headers, the browser blocks the
// response before our code ever runs, and supabase-js just reports
// "Failed to send a request to the Edge Function" with no further detail.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const jwtSecret = new TextEncoder().encode(Deno.env.get('WALLET_JWT_SECRET')!);

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function formatFingerprint(pubKeyHex: string): string {
  const groups = pubKeyHex.slice(0, 16).toUpperCase().match(/.{1,4}/g) ?? [];
  return groups.join('-');
}

Deno.serve(async (req) => {
  // Browsers send a preflight OPTIONS request before the real POST — must
  // answer it with the CORS headers or the browser never sends the POST.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();

    if (body.action === 'challenge') {
      const { signingPublicKey } = body;
      if (!signingPublicKey) {
        return json({ error: 'signingPublicKey is required' }, 400);
      }
      const nonce = randomNonce();
      const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();

      await supabaseAdmin.from('auth_challenges').delete().eq('public_key', signingPublicKey);
      const { error } = await supabaseAdmin
        .from('auth_challenges')
        .insert({ public_key: signingPublicKey, nonce, expires_at: expiresAt });
      if (error) return json({ error: error.message }, 500);

      return json({ nonce });
    }

    if (body.action === 'verify') {
      const { signingPublicKey, encryptionPublicKey, signature, nonce, username, avatarUrl } = body;
      if (!signingPublicKey || !encryptionPublicKey || !signature || !nonce) {
        return json({ error: 'Missing required fields' }, 400);
      }

      // 1. Look up + consume the challenge (single use, must not be expired)
      const { data: challenge, error: challengeErr } = await supabaseAdmin
        .from('auth_challenges')
        .select('*')
        .eq('public_key', signingPublicKey)
        .eq('nonce', nonce)
        .maybeSingle();

      if (challengeErr || !challenge) return json({ error: 'Invalid or expired challenge' }, 401);
      if (new Date(challenge.expires_at).getTime() < Date.now()) {
        await supabaseAdmin.from('auth_challenges').delete().eq('public_key', signingPublicKey);
        return json({ error: 'Challenge expired' }, 401);
      }

      // 2. Verify the Ed25519 signature over the nonce
      const validSig = ed25519.verify(signature, new TextEncoder().encode(nonce), signingPublicKey);
      if (!validSig) return json({ error: 'Invalid signature' }, 401);

      // Challenge is now spent — remove it so it can't be replayed
      await supabaseAdmin.from('auth_challenges').delete().eq('public_key', signingPublicKey);

      // 3. Find or create the user row keyed by public_key
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('public_key', signingPublicKey)
        .maybeSingle();

      let user = existing;
      if (!user) {
        if (!username) return json({ error: 'username is required for first-time signup' }, 400);
        const { data: created, error: createErr } = await supabaseAdmin
          .from('users')
          .insert({
            public_key: signingPublicKey,
            encryption_public_key: encryptionPublicKey,
            public_key_fingerprint: formatFingerprint(signingPublicKey),
            username,
            avatar_url: avatarUrl ?? null,
            status: 'online',
          })
          .select()
          .single();
        if (createErr) return json({ error: createErr.message }, 500);
        user = created;
      } else {
        await supabaseAdmin
          .from('users')
          .update({ status: 'online', last_seen_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // 4. Mint a Supabase-compatible JWT. `sub` == users.id so RLS policies
      //    written as `auth.uid() = users.id` work exactly like normal auth.
      const token = await new jose.SignJWT({ role: 'authenticated' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(jwtSecret);

      return json({ token, expiresIn: SESSION_TTL_SECONDS, user });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
