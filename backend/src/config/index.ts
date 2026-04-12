// Validate critical environment variables
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`FATAL: ${name} environment variable is required`);
  }
  return value || '';
}

function getEnvVarWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// JWT Secret - CRITICAL: Must be set in production
const JWT_SECRET = getEnvVar(
  'JWT_SECRET',
  process.env.NODE_ENV === 'production'
);
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be set in production environment');
}

if (!JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required. ' +
      'Set it in .env file or environment variables.'
  );
}

export const config = {
  jwt: {
    secret: JWT_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256' as const,
  },
  bcrypt: {
    saltRounds: 10,
  },
  server: {
    port: Number(getEnvVarWithDefault('PORT', '4000')),
    env: getEnvVarWithDefault('NODE_ENV', 'development'),
  },
  cors: {
    origins: getEnvVarWithDefault(
      'ALLOWED_ORIGINS',
      'http://localhost:3001,http://localhost:3002'
    ).split(','),
  },
  rateLimit: {
    max: Number(getEnvVarWithDefault('RATE_LIMIT_MAX', '100')),
    windowMs: Number(getEnvVarWithDefault('RATE_LIMIT_WINDOW_MS', '900000')),
  },
  tax: {
    defaultRate: Number(getEnvVarWithDefault('DEFAULT_TAX_RATE', '18')),
  },
  database: {
    url: getEnvVar('DATABASE_URL', process.env.NODE_ENV === 'production'),
  },
  // Stripe is OPTIONAL — only validate if STRIPE_SECRET_KEY is set.
  // If you are using RogerPay / PayPal instead, leave this unset or empty.
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY', false),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', false),
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', false),
  },
};

// Validate configuration on load
if (process.env.NODE_ENV === 'production') {
  console.log('[CONFIG] Running in PRODUCTION mode');
  console.log('[CONFIG] Validating critical configuration...');

  if (
    !config.jwt.secret ||
    config.jwt.secret === 'development-secret-do-not-use-in-production'
  ) {
    throw new Error('FATAL: JWT_SECRET not properly configured for production');
  }

  if (!config.database.url) {
    throw new Error('FATAL: DATABASE_URL not configured');
  }

  // Stripe is optional — warn only
  if (!config.stripe.secretKey) {
    console.log(
      '[CONFIG] ℹ️  STRIPE_SECRET_KEY not set — Stripe payment routes will be disabled. ' +
        'This is expected if you are using RogerPay / PayPal.'
    );
  }

  console.log('[CONFIG] All critical configuration validated ✓');
} else {
  console.log('[CONFIG] Running in DEVELOPMENT mode');
  console.log(
    '[CONFIG] WARNING: Using development defaults - NOT FOR PRODUCTION'
  );
}
