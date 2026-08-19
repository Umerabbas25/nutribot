// IMPORTANT: instrument.ts must be the very first import in main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Capture 100% of transactions for development; reduce in production
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});
