/**
 * Pigion — end-to-end encryption
 *
 * Real E2EE: X25519 ECDH key agreement (see wallet.ts for key derivation)
 * + HKDF-SHA256 to derive a per-conversation AES-256-GCM key + AES-GCM
 * authenticated encryption for every message. The server only ever stores
 * ciphertext; only the two participants' devices can decrypt.
 *
 * NOTE: previous builds of this file used base64 encoding as a placeholder
 * for "encryption" — that was never real E2EE. This file replaces it.
 */
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

const ENVELOPE_PREFIX = 'pgn1:'; // versioned envelope marker

/**
 * Derive a shared AES-256-GCM key for a 1:1 conversation from my X25519
 * secret key and the peer's X25519 public key (hex). Both sides derive the
 * same key independently — it is never transmitted.
 */
export async function deriveSharedKey(
  myEncryptionSecretKey: Uint8Array,
  peerEncryptionPublicKeyHex: string
): Promise<CryptoKey> {
  const sharedSecret = x25519.getSharedSecret(myEncryptionSecretKey, hexToBytes(peerEncryptionPublicKeyHex));
  const keyMaterial = hkdf(sha256, sharedSecret, undefined, 'pigion-message-key-v1', 32);
  return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt plaintext with AES-256-GCM using a shared conversation key. */
export async function encryptE2EEMessage(text: string, sharedKey: CryptoKey): Promise<string> {
  if (!text) return text;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  const payload = new Uint8Array(iv.length + ciphertext.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(ciphertext), iv.length);
  return `${ENVELOPE_PREFIX}${bytesToHex(payload)}`;
}

/** Decrypt an envelope produced by encryptE2EEMessage using the shared key. */
export async function decryptE2EEMessage(envelope: string, sharedKey: CryptoKey): Promise<string> {
  if (!envelope || !isE2EEEncrypted(envelope)) return envelope ?? '';
  try {
    const raw = hexToBytes(envelope.slice(ENVELOPE_PREFIX.length));
    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return '[Unable to decrypt message]';
  }
}

export function isE2EEEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith(ENVELOPE_PREFIX);
}

/**
 * Short, human-verifiable fingerprint for an E2EE session between two real
 * public keys — shown in a "Verify Encryption" UI so users can confirm
 * they're talking to the right person over a second channel, not just
 * trusting the server. Use this once a chat has real derived participant keys.
 */
export function generateSessionFingerprint(myPubKeyHex: string, peerPubKeyHex: string): string {
  const combined = [myPubKeyHex, peerPubKeyHex].sort().join(':');
  const hash = sha256(new TextEncoder().encode(combined));
  const hex = bytesToHex(hash).slice(0, 16).toUpperCase();
  return hex.match(/.{1,4}/g)!.join('-');
}

/**
 * Generate a random display fingerprint (for a chat/session not yet backed
 * by real derived keys). Once a chat's messages are wired to Supabase, its
 * fingerprint should instead come from generateSessionFingerprint() above,
 * derived from the two participants' real X25519 public keys.
 */
export function generateFingerprint(seed: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('') + seed.length.toString(16);
  return hex.slice(0, 16).toUpperCase().match(/.{1,4}/g)!.join('-');
}
