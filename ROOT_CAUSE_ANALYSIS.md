# 🕵️‍♂️ Protocol Zero: Root Cause Analysis

## Executive Summary

We executed a "Zero Trust" debugging protocol to identify why the Storefront and Admin panel were intermittently failing or showing stale content. The investigation confirmed that the application logic is correct, but the **Database Infrastructure Layer** is causing severe latency, leading to timeouts.

## 🔬 Investigation Steps

### Phase 1: Communication Link Verification (Pass ✅)

- **Action:** Injected `[TRACER]` logs with unique IDs (`TRC-1771354274474-748`) into both Storefront and Backend.
- **Result:**
  - Storefront successfully sends requests.
  - Backend successfully receives requests.
  - **Conclusion:** No "Ghost Servers" or broken internal network links.

### Phase 2: Database Performance Check (Fail ❌)

- **Action:** Ran a direct latency test script (`db-perf-test.js`) from the backend server environment.
- **Result:**
  - **Connection Time:** `5603ms` (5.6 Seconds) 🚨
  - **Query Time:** `281ms` (Acceptable)
  - **Impact:** The initial connection handshake takes longer than the default client timeout (5s).

## 📉 The Symptom Explanation

1. **"Storefront not working":** The request times out (408) before the database connects. Browser shows error or blank.
2. **"Admin Panel runs":** It might be reusing an existing connection (pool) or has a longer timeout setting.
3. **"Hallucination":** The code appeared to be broken because it returned nothing, but it was actually just _waiting_ too long.

## 🛠️ Recommendations

1. **Infrastructure:** Check internet connection speed to AWS US East (Virginia). Supabase DB is hosted there.
2. **Configuration:**
   - If using `Transaction Mode (Port 6543)`, consider switching to `Session Mode (Port 5432)` if latency persists, as PgBouncer might be adding overhead or hitting limits.
   - Database URL in `.env`: `postgresql://...:5432/...`
3. **Code (Optional):** Increase `fetch` timeout in `storefront/src/lib/api.ts` to 10s or 15s to tolerate slow connections.
