// Validate critical environment variables
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`FATAL: ${name} environment variable is required`);
  }
  return value || "";
}

function getEnvVarWithDefault(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// JWT Secret - CRITICAL: Must be set in production
const JWT_SECRET = getEnvVar(
  "JWT_SECRET",
  process.env.NODE_ENV === "production",
);
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be set in production environment");
}

// 🔒 FIX-009: Remove hardcoded fallback - fail if not set
if (!JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is required. " +
    "Set it in .env file or environment variables."
  );
}

export const config = {
  jwt: {
    secret: JWT_SECRET, // 🔒 FIX-009: No fallback - JWT_SECRET validated above
    expiresIn: "7d",
    algorithm: "HS256" as const,
  },
  bcrypt: {
    saltRounds: 10,
  },
  server: {
    port: Number(getEnvVarWithDefault("PORT", "4000")),
    env: getEnvVarWithDefault("NODE_ENV", "development"),
  },
  cors: {
    origins: getEnvVarWithDefault(
      "ALLOWED_ORIGINS",
      "http://localhost:3001,http://localhost:3002",
    ).split(","),
  },
  rateLimit: {
    max: Number(getEnvVarWithDefault("RATE_LIMIT_MAX", "100")),
    windowMs: Number(getEnvVarWithDefault("RATE_LIMIT_WINDOW_MS", "900000")), // 15 minutes
  },
  // 🔒 FIX-005: Default GST tax rate
  tax: {
    defaultRate: Number(getEnvVarWithDefault("DEFAULT_TAX_RATE", "18")), // 18% GST default
  },
  // Database
  database: {
    url: getEnvVar("DATABASE_URL", process.env.NODE_ENV === "production"),
  },
  // Stripe
  stripe: {
    secretKey: getEnvVar(
      "STRIPE_SECRET_KEY",
      process.env.NODE_ENV === "production",
    ),
    webhookSecret: getEnvVar("STRIPE_WEBHOOK_SECRET", false),
    publishableKey: getEnvVar("STRIPE_PUBLISHABLE_KEY", false),
  },
};

// Validate configuration on load
if (process.env.NODE_ENV === "production") {
  console.log("[CONFIG] Running in PRODUCTION mode");
  console.log("[CONFIG] Validating critical configuration...");

  if (
    !config.jwt.secret ||
    config.jwt.secret === "development-secret-do-not-use-in-production"
  ) {
    throw new Error("FATAL: JWT_SECRET not properly configured for production");
  }

  if (!config.database.url) {
    throw new Error("FATAL: DATABASE_URL not configured");
  }

  if (!config.stripe.secretKey) {
    throw new Error("FATAL: STRIPE_SECRET_KEY not configured");
  }

  console.log("[CONFIG] All critical configuration validated ✓");
} else {
  console.log("[CONFIG] Running in DEVELOPMENT mode");
  console.log(
    "[CONFIG] WARNING: Using development defaults - NOT FOR PRODUCTION",
  );
}
