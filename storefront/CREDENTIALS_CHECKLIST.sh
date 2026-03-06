#!/bin/bash
# ==========================================
# PRODUCTION CREDENTIALS CHECKLIST
# ==========================================
# 
# Use this checklist to gather all required credentials for production deployment
# Date: March 6, 2026
# Status: Collecting credentials
#

echo "🔐 Kvastram Production Credentials Checklist"
echo "=============================================="
echo ""
echo "Instructions:"
echo "1. Contact the Operations/DevOps team for each credential"
echo "2. Mark [ ] when you have each credential"
echo "3. Store securely - DO NOT commit to git"
echo "4. Update .env.production with collected values"
echo ""
echo "Required Credentials:"
echo ""

# API URL
echo "[ ] NEXT_PUBLIC_API_URL"
echo "    - Production API base URL (e.g., https://api.kvastram.com)"
echo "    - Obtained from: DevOps/Backend team"
echo ""

# Stripe Keys
echo "[ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "    - Format: pk_live_... (LIVE key, not test)"
echo "    - Obtained from: Stripe Dashboard > Developers > API Keys"
echo "    - Portal: https://dashboard.stripe.com"
echo ""

echo "[ ] STRIPE_SECRET_KEY (Backend only, not needed here)"
echo "    - Secret key should be in backend .env, never in frontend"
echo ""

# Google OAuth
echo "[ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID"
echo "    - Format: xxxxx.apps.googleusercontent.com"
echo "    - Obtained from: Google Cloud Console"
echo "    - Portal: https://console.cloud.google.com"
echo "    - Project: Kvastram (production)"
echo ""

# Facebook App
echo "[ ] NEXT_PUBLIC_FACEBOOK_APP_ID"
echo "    - Format: 123456789xxxxxxx (numeric)"
echo "    - Obtained from: Meta App Dashboard"
echo "    - Portal: https://developers.facebook.com/apps"
echo "    - App: Kvastram (production)"
echo ""

# Sentry
echo "[ ] NEXT_PUBLIC_SENTRY_DSN"
echo "    - Format: https://key@org.ingest.sentry.io/123456"
echo "    - Already exists: Check existing .env.local"
echo "    - Obtained from: Sentry Dashboard > Project Settings"
echo ""

# LogRocket
echo "[ ] NEXT_PUBLIC_LOGROCKET_APP_ID"
echo "    - Format: organization/app-name"
echo "    - Example: kvastram/storefront-production"
echo "    - Obtained from: LogRocket Dashboard"
echo ""

# Tawk.to
echo "[ ] NEXT_PUBLIC_TAWK_PROPERTY_ID"
echo "    - Format: xxxxx/xxxxx (two parts)"
echo "    - Example: 69916132e258621c36ed87d2/1jhfu7bu0"
echo "    - Obtained from: Tawk.to Dashboard > Channels"
echo ""

# Feature Flags
echo "[ ] NEXT_PUBLIC_ENABLE_ANALYTICS"
echo "    - Value: true (for production)"
echo ""

echo "[ ] NEXT_PUBLIC_ENABLE_SESSION_RECORDING"
echo "    - Value: true (for production)"
echo ""

echo ""
echo "Verification Checklist:"
echo "[ ] All credentials obtained"
echo "[ ] Credentials verified by team lead"
echo "[ ] .env.production file created"
echo "[ ] Production build tested: npm run build"
echo "[ ] Environment variables resolved (no 'undefined' values)"
echo "[ ] Build artifacts checked (.next/)"
echo "[ ] Ready for deployment"
echo ""

echo "Security Reminders:"
echo "⚠️  NEVER commit .env.production to git"
echo "⚠️  NEVER test with real payment keys locally"
echo "⚠️  ALWAYS use 'LIVE' keys for production (not test keys)"
echo "⚠️  Store credentials securely (1Password/Vault/etc)"
echo "⚠️  Rotate keys every 6 months"
echo "⚠️  Monitor Sentry/LogRocket dashboards for errors"
echo ""
