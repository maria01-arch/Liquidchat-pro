/**
 * Pigion — in-memory auth token store.
 *
 * Holds the short-lived JWT minted by the wallet-auth edge function after a
 * successful signature challenge. Deliberately NOT persisted to
 * localStorage/sessionStorage: the mnemonic never leaves memory either, so
 * closing the tab ends the session. Re-opening the app requires the
 * passphrase again — that's the tradeoff of "no password reset, ever."
 *
 * (A future "remember this device" feature could wrap the mnemonic in a
 * WebAuthn/biometric-gated local keystore — intentionally not done here to
 * avoid shipping a half-secure version of that.)
 */
let currentToken: string | null = null;
let expiresAt = 0;

export function setAuthToken(token: string, expiresInSeconds: number) {
  currentToken = token;
  expiresAt = Date.now() + expiresInSeconds * 1000;
}

export function clearAuthToken() {
  currentToken = null;
  expiresAt = 0;
}

export function getAuthToken(): string | null {
  if (!currentToken || Date.now() >= expiresAt) return null;
  return currentToken;
}

export function isAuthTokenExpiringSoon(bufferSeconds = 60): boolean {
  if (!currentToken) return false;
  return Date.now() >= expiresAt - bufferSeconds * 1000;
}
