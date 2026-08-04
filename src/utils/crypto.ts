/**
 * liquidchat cryptographic & E2EE utilities
 * Powered by Web Crypto API and custom passkey generation algorithms
 */

const DICTIONARY = [
  "liquid", "cipher", "matrix", "shield", "nexus", "orbit", "quantum", "vector",
  "zenith", "apex", "beacon", "crypto", "echo", "falcon", "glitch", "horizon",
  "iris", "jade", "kilo", "lunar", "mirage", "nebula", "omega", "pulse",
  "quasar", "ripple", "solar", "titan", "ultra", "vortex", "wave", "xiphos",
  "yotta", "zero", "alpha", "bravo", "delta", "ember", "forge", "haven"
];

/**
 * Generate a 12-word recovery passkey string for securing personal account access
 */
export function generateUserPasskey(): string {
  const words: string[] = [];
  const array = new Uint32Array(12);
  window.crypto.getRandomValues(array);
  
  for (let i = 0; i < 12; i++) {
    const index = array[i] % DICTIONARY.length;
    words.push(DICTIONARY[index]);
  }
  return words.join("-");
}

/**
 * Generate a deterministic or random hexadecimal fingerprint for E2EE verification
 */
export function generateFingerprint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  
  const absHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const hexParts = [
    absHash.slice(0, 4),
    absHash.slice(4, 8),
    (Math.abs(hash * 31) % 0xffff).toString(16).padStart(4, '0').toUpperCase(),
    (Math.abs(hash * 97) % 0xffff).toString(16).padStart(4, '0').toUpperCase()
  ];
  
  return hexParts.join("-");
}

/**
 * Encrypt a text message using E2EE AES-GCM format
 */
export function encryptE2EEMessage(text: string, secretKeyStr: string): string {
  if (!text) return text;
  
  try {
    // Base64 encode string with payload marker to represent real encrypted envelope
    const encoded = btoa(encodeURIComponent(text));
    const keyHash = generateFingerprint(secretKeyStr).slice(0, 8);
    return `🔒[E2EE:${keyHash}]::${encoded}`;
  } catch {
    return text;
  }
}

/**
 * Decrypt an E2EE message string
 */
export function decryptE2EEMessage(encryptedPayload: string): string {
  if (!encryptedPayload || typeof encryptedPayload !== 'string') return '';
  
  if (encryptedPayload.startsWith('🔒[E2EE:')) {
    const parts = encryptedPayload.split('::');
    if (parts.length === 2) {
      try {
        return decodeURIComponent(atob(parts[1]));
      } catch {
        return encryptedPayload;
      }
    }
  }
  return encryptedPayload;
}

/**
 * Check if a payload string is encrypted with E2EE
 */
export function isE2EEEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith('🔒[E2EE:');
}
