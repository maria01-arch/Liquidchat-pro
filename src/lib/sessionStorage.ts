/**
 * Pigion — local session persistence
 *
 * Stores the mnemonic locally so refreshing the tab doesn't log you out —
 * matching how WhatsApp Web / Telegram Web stay logged in until you
 * explicitly sign out, rather than a bank-style "session expires on
 * refresh" model.
 *
 * Tradeoff, stated plainly: this means your recovery phrase sits in this
 * browser's localStorage in the clear. Anyone with access to this device/
 * browser profile (or a successful XSS attack on this site) could read it.
 * That's the standard tradeoff every "stay logged in" web app makes. If you
 * want stronger protection later (e.g. requiring a device PIN/biometric via
 * WebAuthn to unlock the stored phrase), that's a reasonable follow-up.
 */
const STORAGE_KEY = 'pigion_session_v1';

export function saveSessionMnemonic(mnemonic: string) {
  try {
    localStorage.setItem(STORAGE_KEY, mnemonic);
  } catch {
    // localStorage unavailable (private browsing, etc.) — session just won't persist.
  }
}

export function loadSessionMnemonic(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearSessionMnemonic() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
