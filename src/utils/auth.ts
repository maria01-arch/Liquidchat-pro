/**
 * Pigion — wallet-style sign up / login
 *
 * Signup: generate a new 12-word phrase, derive keys, register the account.
 * Login:  re-derive the *same* keys from an existing phrase, prove
 *         ownership by signing a server challenge, get a session back.
 *
 * The phrase is the only credential. There is intentionally no "forgot
 * password" flow — anyone who can produce a valid signature for an account's
 * public key IS that account, on any device, by design.
 */
import { supabase } from '../lib/supabaseClient';
import { setAuthToken, clearAuthToken } from '../lib/authToken';
import { saveSessionMnemonic, loadSessionMnemonic, clearSessionMnemonic } from '../lib/sessionStorage';
import {
  generateNewMnemonic,
  deriveIdentityFromMnemonic,
  signChallenge,
  type PigionIdentity,
} from './wallet';
import type { User } from '../types';

export interface WalletAuthResult {
  identity: PigionIdentity;
  user: User;
  /** Only ever populated right after signup — show it once, then discard. */
  isNewAccount: boolean;
}

function mapDbUserToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    avatar: row.avatar_url ?? '',
    encryptionPublicKey: row.encryption_public_key,
    signingPublicKey: row.public_key,
    status: row.status,
    customStatus: row.custom_status ?? undefined,
    bio: row.bio ?? undefined,
    createdAt: row.created_at,
    publicKeyFingerprint: row.public_key_fingerprint,
  };
}

async function requestChallenge(signingPublicKey: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: { action: 'challenge', signingPublicKey },
  });
  if (error) throw new Error(error.message ?? 'Failed to request login challenge');
  if (!data?.nonce) throw new Error('Server did not return a challenge');
  return data.nonce as string;
}

async function verifyAndGetSession(
  identity: PigionIdentity,
  nonce: string,
  opts?: { username?: string; avatarUrl?: string }
): Promise<{ user: User; isNewAccount: boolean }> {
  const signature = signChallenge(identity, nonce);

  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: {
      action: 'verify',
      signingPublicKey: identity.signingPublicKey,
      encryptionPublicKey: identity.encryptionPublicKey,
      signature,
      nonce,
      username: opts?.username,
      avatarUrl: opts?.avatarUrl,
    },
  });

  if (error) throw new Error(error.message ?? 'Login verification failed');
  if (!data?.token || !data?.user) throw new Error('Server did not return a session');

  setAuthToken(data.token, data.expiresIn ?? 3600);
  const isNewAccount = !!opts?.username;
  return { user: mapDbUserToUser(data.user), isNewAccount };
}

/** Create a brand-new Pigion identity + account. Returns the mnemonic ONCE. */
export async function signUpWithNewWallet(username: string, avatarUrl?: string): Promise<WalletAuthResult> {
  const mnemonic = generateNewMnemonic();
  const identity = deriveIdentityFromMnemonic(mnemonic);
  const nonce = await requestChallenge(identity.signingPublicKey);
  const { user, isNewAccount } = await verifyAndGetSession(identity, nonce, { username, avatarUrl });
  saveSessionMnemonic(mnemonic);
  return { identity, user, isNewAccount };
}

/** Log in on any device using an existing 12-word phrase. */
export async function loginWithMnemonic(mnemonic: string): Promise<WalletAuthResult> {
  const identity = deriveIdentityFromMnemonic(mnemonic); // throws if invalid
  const nonce = await requestChallenge(identity.signingPublicKey);
  const { user, isNewAccount } = await verifyAndGetSession(identity, nonce);
  saveSessionMnemonic(mnemonic);
  return { identity, user, isNewAccount };
}

/**
 * Silently re-log-in using a phrase already saved on this device (called on
 * app load). Returns null if there's no saved session or it fails to
 * re-authenticate — caller should fall back to the login screen.
 */
export async function restoreSession(): Promise<WalletAuthResult | null> {
  const mnemonic = loadSessionMnemonic();
  if (!mnemonic) return null;
  try {
    return await loginWithMnemonic(mnemonic);
  } catch (err) {
    console.error('[Pigion] Failed to restore saved session:', err);
    clearSessionMnemonic();
    return null;
  }
}

export function logout() {
  clearAuthToken();
  clearSessionMnemonic();
}
