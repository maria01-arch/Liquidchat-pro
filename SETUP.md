# Pigion — Setup Notes

## Live vs. demo mode
Pigion now detects whether Supabase is configured (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env`):
- **Not configured → demo mode**: exactly as before, local mock data, fully explorable with zero setup.
- **Configured + you complete a real signup/login → live mode**: chats load from Supabase, direct-message content is genuinely end-to-end encrypted (X25519 + AES-256-GCM) and persisted, and new messages arrive over Supabase Realtime.

## To run locally
```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## To stand up the Supabase backend
1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor (or `supabase db push`).
3. Deploy the edge function:
   ```bash
   supabase functions deploy wallet-auth
   supabase secrets set SUPABASE_JWT_SECRET=<Settings -> API -> JWT Secret>
   ```
4. Put your project URL + anon key into `.env`.
5. Sign up in the app — you'll get a real 12-word phrase; log in with it from any device/browser afterward.

## What this pass covers
- Real wallet-style auth (BIP39 → Ed25519/X25519, challenge/signature login, no password reset by design).
- Real E2EE for **direct (1:1) chats**: messages are encrypted client-side before hitting the database; Supabase only ever stores ciphertext.
- Live chat list + message history fetched from Supabase; new messages delivered over Realtime.
- Starting a new direct chat from Contacts creates/reuses a real `chats` row when logged in live.

## Deliberately not done yet (next phase)
- **Group chat E2EE**: group messages currently pass through as plaintext rows. Encrypting to multiple recipients securely needs a real multi-party scheme (Signal-style "sender keys" or MLS) — flagged rather than faked.
- **Vault → Supabase Storage**: file uploads still use local mock data.
- **Calls, reactions, read receipts** over the live backend.
- General bug/stability sweep — easier to do meaningfully once the backend is live and you can exercise real flows end to end.

## A note on the "no forgotten password" tradeoff
Since the 12-word phrase is the only credential, it's held in memory only for this pass — refreshing the tab requires logging in again. A "remember this device" option (WebAuthn/biometric-gated local keystore) is a reasonable next feature but intentionally not shipped half-secure here.
