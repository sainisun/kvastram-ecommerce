import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Define how likely traces are sampled
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Define how likely Replay events are sampled
  replaysSessionSampleRate: 0.1,
  
  // Define how likely Replay events are sampled when an error occurs
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: process.env.NODE_ENV === 'development',
  
  // Only enable Sentry in production or if DSN is provided
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release version (helps track which deployments introduced errors)
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'kvastram-storefront@1.0.0',
  
  // Before sending event, you can modify it
  beforeSend(event) {
    // Don't send errors in development if no DSN is configured
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
