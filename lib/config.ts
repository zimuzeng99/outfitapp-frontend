const DEFAULT_API_BASE_URL =
  'https://outfitapp-backend-production.up.railway.app';

/** Backend base URL. Override with EXPO_PUBLIC_API_BASE_URL in `.env` / `.env.local`. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

/**
 * Optional fixed user id for local/dev runs (e.g. a seeded backend test user).
 * Set via EXPO_PUBLIC_TEST_USER_ID in `.env` or `.env.local`.
 */
export const TEST_USER_ID = process.env.EXPO_PUBLIC_TEST_USER_ID?.trim() || null;
