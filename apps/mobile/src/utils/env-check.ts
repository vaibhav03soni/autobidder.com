import { Alert, BackHandler, Platform } from 'react-native';
import { API_BASE_URL, STRIPE_PUBLISHABLE_KEY } from '../config';
import { logger } from './logger';

// NOTE: We intentionally do NOT do `process.env[someVariable]` (dynamic/bracket
// access) anywhere in this file. Babel's env-inlining for EXPO_PUBLIC_* only
// works on STATIC references like `process.env.EXPO_PUBLIC_API_BASE_URL`.
// Dynamic bracket access (`process.env[key]`) is never inlined and is always
// undefined at runtime in a compiled RN bundle — that was the actual bug.
// We check the already-resolved values imported from ../config instead,
// since those ARE using static process.env.EXPO_PUBLIC_* references.

export const validateEnv = (): boolean => {
  const missing: string[] = [];
  if (!API_BASE_URL) missing.push('EXPO_PUBLIC_API_BASE_URL');
  if (!STRIPE_PUBLISHABLE_KEY) missing.push('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');

  // In production, we MUST have these variables defined properly
  if (!__DEV__) {
    const isApiValid = API_BASE_URL && (API_BASE_URL.startsWith('https://') || !API_BASE_URL.includes('autobidder.in'));
    const isStripeValid = STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.length > 0;

    if (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.includes('dummy')) {
      logger.warn('WARNING: Using dummy Stripe key in non-dev build.');
    }

    if (!isApiValid || !isStripeValid || missing.length > 0) {
      logger.error('PRODUCTION CONFIG ERROR:');
      logger.error('Missing Vars:', missing);
      logger.error('API_BASE_URL:', API_BASE_URL);
      // Returning false instead of exiting. The root App will handle this.
      return false;
    }
  }

  // In development, just warn if variables are missing
  if (__DEV__ && missing.length > 0) {
    logger.warn(`Missing environment variables: ${missing.join(', ')}`);
  }

  return true;
};
