/**
 * Pigion — wallet-style identity
 *
 * Replaces traditional username/password auth with a single 12-word secret
 * phrase (BIP39), exactly like a crypto wallet (Trust Wallet, MetaMask,
 * etc.). The phrase deterministically derives:
 *   - an Ed25519 keypair, used to sign a login challenge (proves identity)
 *   - an X25519 keypair, used for E2EE key agreement (see crypto.ts)
 *
 * There is no password reset and no server-side secret storage, by design:
 * whoever holds the phrase controls the account. Losing it means losing
 * the account — this must be made very clear in the UI (see AuthModal).
 */
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { ed25519, x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { bytesToHex } from '@noble/hashes/utils';

export interface PigionIdentity {
  mnemonic: string;
  signingPublicKey: string;   // hex, Ed25519 — used as the account's public identity
  signingSecretKey: Uint8Array;
  encryptionPublicKey: string; // hex, X25519 — used for E2EE key agreement
  encryptionSecretKey: Uint8Array;
  fingerprint: string;        // short human-verifiable fingerprint, derived from signingPublicKey
}

/** Generate a brand-new 12-word BIP39 mnemonic (128 bits of entropy). */
export function generateNewMnemonic(): string {
  return generateMnemonic(wordlist, 128);
}

export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic.trim().toLowerCase(), wordlist);
}

/**
 * Derive the full Pigion identity (signing + encryption keypairs) from a
 * mnemonic. This is fully deterministic: the same phrase always yields the
 * same keys, on any device, forever — that's what makes "login anywhere,
 * any time, no password reset" possible.
 */
export function deriveIdentityFromMnemonic(mnemonic: string): PigionIdentity {
  const normalized = mnemonic.trim().toLowerCase();
  if (!isValidMnemonic(normalized)) {
    throw new Error('Invalid recovery phrase.');
  }

  // BIP39 seed (no extra passphrase salt — the 12 words ARE the whole secret)
  const seed = mnemonicToSeedSync(normalized); // 64 bytes

  // Domain-separate two independent 32-byte keys from the same seed via HKDF
  const signingSeed = hkdf(sha256, seed, undefined, 'pigion-signing-v1', 32);
  const encryptionSeed = hkdf(sha256, seed, undefined, 'pigion-encryption-v1', 32);

  const signingSecretKey = signingSeed;
  const signingPublicKey = ed25519.getPublicKey(signingSecretKey);

  const encryptionSecretKey = encryptionSeed;
  const encryptionPublicKey = x25519.getPublicKey(encryptionSecretKey);

  const signingPubHex = bytesToHex(signingPublicKey);

  return {
    mnemonic: normalized,
    signingPublicKey: signingPubHex,
    signingSecretKey,
    encryptionPublicKey: bytesToHex(encryptionPublicKey),
    encryptionSecretKey,
    fingerprint: formatFingerprint(signingPubHex),
  };
}

/** Human-verifiable fingerprint for safety-number style verification UI. */
export function formatFingerprint(pubKeyHex: string): string {
  const groups = pubKeyHex.slice(0, 16).toUpperCase().match(/.{1,4}/g) ?? [];
  return groups.join('-');
}

/** Sign an arbitrary challenge string with the identity's signing key. */
export function signChallenge(identity: PigionIdentity, challenge: string): string {
  const msg = new TextEncoder().encode(challenge);
  const sig = ed25519.sign(msg, identity.signingSecretKey);
  return bytesToHex(sig);
}

export function verifySignature(pubKeyHex: string, challenge: string, signatureHex: string): boolean {
  try {
    const msg = new TextEncoder().encode(challenge);
    return ed25519.verify(signatureHex, msg, pubKeyHex);
  } catch {
    return false;
  }
}
