/**
 * Pigion — Private Number
 *
 * Instead of a phone number tied to a real telecom carrier, every account
 * can claim one permanent, randomly-generated "private number" formatted
 * like a phone number for a country the user picks. It's purely an
 * in-app identifier: nobody can SMS/call it, it doesn't reveal your real
 * phone or location, and once generated it never changes — the same
 * number always resolves to the same account, forever.
 *
 * Storage vs. display: the DB stores a canonical, space-free form (e.g.
 * "+14155550199") as the unique lookup key, plus a pre-formatted display
 * string (e.g. "+1 415 555 0199") so the UI never has to re-derive
 * grouping from an ambiguous dial-code length.
 */

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  dialCode: string; // e.g. "+1"
  digits: number; // national significant number length to generate
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', digits: 10 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', digits: 10 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', digits: 10 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', digits: 10 },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', digits: 9 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', digits: 9 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', digits: 9 },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', digits: 10 },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', digits: 10 },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', digits: 10 },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', digits: 11 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', digits: 10 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', digits: 10 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', digits: 10 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', digits: 10 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', digits: 9 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', digits: 10 },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', digits: 9 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', digits: 10 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', digits: 9 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', digits: 9 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', digits: 9 },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', digits: 9 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', digits: 9 },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', digits: 10 },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', digits: 10 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', digits: 9 },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', digits: 9 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', digits: 11 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', digits: 10 },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', digits: 10 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', digits: 9 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', digits: 9 },
];

function randomDigits(length: number): string {
  let result = String(Math.floor(Math.random() * 9) + 1); // never leads with 0
  for (let i = 1; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

export interface GeneratedPrivateNumber {
  canonical: string; // e.g. "+14155550199" — unique DB key, used for exact-match search
  display: string; // e.g. "+1 415 555 0199" — shown in the UI
}

export function generatePrivateNumber(country: CountryOption): GeneratedPrivateNumber {
  const national = randomDigits(country.digits);
  const canonical = `${country.dialCode}${national}`;
  const groups = national.match(/.{1,3}/g) ?? [national];
  const display = `${country.dialCode} ${groups.join(' ')}`;
  return { canonical, display };
}

/** Normalizes user-pasted/typed input (strips spaces/dashes/parens) to match the canonical DB form. */
export function normalizePrivateNumber(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  return (hasPlus ? '+' : '') + digitsOnly;
}
