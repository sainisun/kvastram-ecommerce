# ✅ DAILY EXECUTION CHECKLIST

**Project:** Kvastram Storefront - All Issues Fix  
**Timeline:** 3 weeks (Mar 5-27, 2026)

---

## 📋 WEEK 1: CRITICAL FIXES (Mar 5-11)

### Monday, March 5-6: Task 1 - Type Definitions

**Morning (2-3 hours)**
- [ ] Read EXECUTION_PLAN_DETAILED.md Task 1 section
- [ ] Create `src/types/api-contracts.ts`
  - [ ] Copy type definitions
  - [ ] Verify file exists: `ls src/types/api-contracts.ts`
  - [ ] Run: `npm run build` (check for errors)

**Afternoon (2-3 hours)**
- [ ] Create `src/lib/api-adapters.ts`
  - [ ] Copy all adapter functions
  - [ ] Add `import` statements to `src/lib/api.ts`
  - [ ] Run: `npm run build` (verify no errors)

**Evening (1 hour)**
- [ ] Test in browser: `npm run dev`
  - [ ] Open `http://localhost:3000`
  - [ ] Navigate to `/products`
  - [ ] Check browser console for errors
  - [ ] Take screenshot if successful

**End of Day Checklist**
- [ ] npm run build passes without errors
- [ ] npm run dev starts successfully
- [ ] Products page loads without console errors
- [ ] Commit changes: `git add . && git commit -m "refactor: standardize product types"`

---

### Tuesday, March 6-8: Task 2 - API Standardization

**Day 1 (Mar 6)**

Morning (2 hours):
- [ ] Create `src/docs/api-contract.md`
  - [ ] Document current states of all endpoints
  - [ ] List required standardization for each

Afternoon (3 hours):
- [ ] Create `src/lib/api-guards.ts` with type guards
  - [ ] Copy isProductArray, isProduct, etc.
  - [ ] Test: `npm run build`

**Day 2 (Mar 7)**

All day:
- [ ] Update `getProducts()` in `src/lib/api.ts`
  - [ ] Follow pattern from EXECUTION_PLAN
  - [ ] Test: `npm run build`
  - [ ] Test: `npm run dev` → navigate to /products

- [ ] Update `getProduct()` in `src/lib/api.ts`
  - [ ] Follow same pattern
  - [ ] Test: `npm run build`
  - [ ] Test: `npm run dev` → click on product

**Day 3 (Mar 8)**

All day:
- [ ] Update remaining endpoints (getFeaturedProducts, searchProducts, getCollections, etc.)
  - [ ] One endpoint at a time
  - [ ] Test each: `npm run build`
  - [ ] Manual test in browser

**End of Day Checklist**
- [ ] All API functions updated
- [ ] npm run build passes
- [ ] All main pages load without errors
- [ ] Browser DevTools shows no console errors
- [ ] Commit: `git commit -m "refactor: standardize API response format"`

---

### Thursday, March 8: Task 3 - Production Environment

**Morning (1 hour)**
- [ ] Request from Operations team:
  - [ ] Stripe Live Publishable Key
  - [ ] Google OAuth Client ID
  - [ ] Facebook App ID
  - [ ] Production API URL
  - [ ] Confirm Sentry DSN

**Afternoon (1 hour)**
- [ ] Create `.env.production` file with:
  - [ ] All required credentials
  - [ ] Verify `cat .env.production` shows values
  - [ ] Verify not in git: `git status .env.production` (should show `?? .env.production`)

**Evening (30 min)**
- [ ] Test production build:
  ```bash
  NODE_ENV=production npm run build
  npm run start
  ```
  - [ ] Opens at http://localhost:3000
  - [ ] All features work
  - [ ] No errors in console

**End of Day Checklist**
- [ ] `.env.production` created with real credentials
- [ ] `.env.production` in .gitignore
- [ ] Production build successful
- [ ] Commit: `git commit -m "chore: add production environment config"`

---

### Friday-Saturday, Mar 9-11: Tasks 4 & 5 (Can do in parallel)

**Task 4: CSRF Protection (1.5 days)**

Friday Morning (1 hour):
- [ ] Create `src/lib/csrf.ts`
  - [ ] Copy all methods from CODE_SNIPPETS
  - [ ] Verify: `npm run build`

Friday Afternoon (1 hour):
- [ ] Update `src/app/layout.tsx`
  - [ ] Add meta tag with CSRF token
  - [ ] Test: `npm run build`
  - [ ] Test: `npm run dev` → check page source for meta tag

Saturday Morning (30 min):
- [ ] Update `src/lib/api.ts` - fetchWithTrace function
  - [ ] Add CSRF header for non-GET requests
  - [ ] Test: `npm run build`
  - [ ] Test: `npm run dev`

**Task 5: Consent Management (1.5 days)**

Friday Afternoon (1 hour):
- [ ] Create `src/lib/consent-manager.ts`
  - [ ] Copy all methods
  - [ ] Verify: `npm run build`

Saturday Morning (1 hour):
- [ ] Update `src/components/ui/CookieConsent.tsx`
  - [ ] Replace with consent code from snippets
  - [ ] Test: `npm run dev`
  - [ ] Open in browser, see consent banner

Saturday Afternoon (30 min):
- [ ] Update Analytics, LogRocket, Tawk components
  - [ ] Each checks `ConsentManager.hasConsented()`
  - [ ] Test: Scripts only load after accepting consent
  - [ ] Test: localStorage shows "kvastram_user_consent"

**End of Week Checklist - Task 4**
- [ ] CSRF token in page meta tag
- [ ] x-csrf-token in all POST/PUT/DELETE requests
- [ ] npm run build passes
- [ ] Commit: `git commit -m "security: implement CSRF protection"`

**End of Week Checklist - Task 5**
- [ ] Consent banner appears on first visit
- [ ] Consent stored in localStorage
- [ ] Consent persists across sessions
- [ ] Analytics/LogRocket respect consent
- [ ] npm run build passes
- [ ] Commit: `git commit -m "privacy: implement consent management"`

---

## 📋 WEEK 2: QUALITY & PERFORMANCE (Mar 12-19)

### Monday-Tuesday, Mar 12-13: Task 6 - Performance

**Monday (1 day)**

Morning (2 hours):
- [ ] Create component split directory
  ```bash
  mkdir -p src/components/home
  ```

- [ ] Create `src/components/home/HeroSection.tsx`
  - [ ] Extract hero code from `src/app/page.tsx`
  - [ ] Update imports
  - [ ] Test: `npm run build`

Afternoon (2 hours):
- [ ] Create remaining home components
  - [ ] `FeaturedProducts.tsx`
  - [ ] `TestimonialsSection.tsx`
  - [ ] `Newsletter.tsx`
  - [ ] Test: `npm run build`

Evening (1 hour):
- [ ] Update `src/app/page.tsx` to use new components
  - [ ] Import components
  - [ ] Remove old code
  - [ ] Verify file now ~150 lines (was 722)
  - [ ] Test: `npm run dev` → homepage still works

**Tuesday (1 day)**

All day:
- [ ] Add React.memo to component lists
  - [ ] Update ProductGrid.tsx
  - [ ] Update ProductCarousel.tsx
  - [ ] Test each: `npm run build && npm run dev`

- [ ] Optimize images
  - [ ] Add width/height to all `<Image>` tags
  - [ ] Add quality={85}
  - [ ] Add priority for hero images
  - [ ] Test: `npm run build`
  - [ ] Test: `npm run dev` → images load correctly

**End of Day Checklist**
- [ ] page.tsx reduced from 722 → ~150 lines
- [ ] All components split and working
- [ ] React.memo applied to lists
- [ ] Images optimized with dimensions
- [ ] npm run build passes
- [ ] npm run dev loads homepage successfully
- [ ] Commit: `git commit -m "perf: optimize components and images"`

---

### Wednesday-Friday, Mar 15-19: Task 7 - Testing

**Wednesday (1 day)**

Morning (2 hours):
- [ ] Setup Jest
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
  ```
  - [ ] Create `jest.config.js`
  - [ ] Create `jest.setup.js`
  - [ ] Update `package.json` scripts

Afternoon (2 hours):
- [ ] Verify Jest works
  ```bash
  npm test -- --version
  npm test
  ```
  - [ ] Should show "Tests: 0 passed" (no tests yet)

**Thursday (1 day)**

All day:
- [ ] Write component tests
  - [ ] Create `src/components/__tests__/ProductCard.test.tsx`
  - [ ] Create `src/components/__tests__/ProductGrid.test.tsx`
  - [ ] Create `src/context/__tests__/cart-context.test.tsx`
  - [ ] Each test file: 2-3 test cases

- [ ] Write utility tests
  - [ ] `src/lib/__tests__/api.test.ts` (5 tests)
  - [ ] `src/lib/__tests__/utils.test.ts` (5 tests)

- [ ] Run tests
  ```bash
  npm test
  ```
  - [ ] All tests passing
  - [ ] No console errors

**Friday (1 day)**

All day:
- [ ] Expand E2E tests
  - [ ] Update `e2e/storefront.spec.ts`
  - [ ] Add 5-10 new test scenarios:
    - Registration flow
    - Login flow
    - Product search
    - Add to cart
    - Checkout
    - Wishlist
    - Account

- [ ] Run tests
  ```bash
  npx playwright test
  ```
  - [ ] All E2E tests passing
  - [ ] Screenshots generated

- [ ] Generate coverage report
  ```bash
  npm run test:coverage
  ```
  - [ ] Target: >70% coverage
  - [ ] Check report in coverage/ directory

**End of Week Checklist**
- [ ] Jest configured and working
- [ ] 15+ unit tests written and passing
- [ ] 15+ E2E tests written and passing
- [ ] Coverage report shows >70%
- [ ] All critical paths covered
- [ ] npm test passes
- [ ] npx playwright test passes
- [ ] Commit: `git commit -m "test: expand unit and E2E test coverage"`

---

## 📋 WEEK 3: FINAL POLISH (Mar 20-27)

### Monday-Tuesday, Mar 20-21: Task 8 - Documentation

**Monday (4 hours)**

- [ ] Create `DEPLOYMENT_GUIDE.md`
  - [ ] Prerequisites section
  - [ ] Environment setup
  - [ ] Database migrations
  - [ ] Build process
  - [ ] Deployment commands
  - [ ] Post-deployment checks

- [ ] Create `ENV_VARIABLES.md`
  - [ ] All required variables listed
  - [ ] Optional variables documented
  - [ ] How to get each value
  - [ ] Development vs. production

**Tuesday (4 hours)**

- [ ] Create `INCIDENT_GUIDE.md`
  - [ ] Common issues
  - [ ] Troubleshooting steps
  - [ ] Rollback procedures
  - [ ] Emergency contacts

- [ ] Create `PRE_LAUNCH_CHECKLIST.md`
  - [ ] Build verification
  - [ ] Performance testing
  - [ ] Security testing
  - [ ] UAT items

**End of Day Checklist**
- [ ] All documentation files created
- [ ] Each document has clear instructions
- [ ] No spelling errors
- [ ] Links verified
- [ ] Commit: `git commit -m "docs: add deployment and incident guides"`

---

### Wednesday-Thursday, Mar 22-24: Final Testing

**Wednesday (Full Day)**

Morning (4 hours):
- [ ] Complete Manual Testing Checklist
  - [ ] Homepage loads
  - [ ] Products page loads
  - [ ] Product detail pages work
  - [ ] Search functionality works
  - [ ] Collections work
  - [ ] Cart operations work
  - [ ] Add to wishlist works
  - [ ] User registration works
  - [ ] User login works
  - [ ] Checkout works (sandbox)
  - [ ] Order tracking works
  - [ ] Footer links work

Afternoon (4 hours):
- [ ] Browser Testing
  - [ ] Chrome/Chromium ✓
  - [ ] Firefox ✓
  - [ ] Safari ✓
  - [ ] Edge ✓

- [ ] Mobile Testing
  - [ ] iPhone screen size ✓
  - [ ] Android screen size ✓
  - [ ] Tablet size ✓
  - [ ] Responsive design ✓

**Thursday (Full Day)**

Morning (4 hours):
- [ ] Performance Testing
  - [ ] Run Lighthouse audit: `npm run build` → test locally
  - [ ] Check Core Web Vitals
  - [ ] Verify Lighthouse score > 85
  - [ ] Note any issues

Afternoon (4 hours):
- [ ] Security Testing
  - [ ] Check security headers present
  - [ ] Verify CSRF tokens in forms
  - [ ] Check consent banner working
  - [ ] Verify auth protected routes
  - [ ] Test payment flow (sandbox)

**End of Testing Checklist**
- [ ] All manual tests passed
- [ ] All browsers tested
- [ ] Mobile responsive working
- [ ] Lighthouse score > 85
- [ ] Security headers verified
- [ ] CSRF working
- [ ] Consent working
- [ ] No critical bugs found

---

### Friday, Mar 27: Go-Live Preparation

**Morning (4 hours)**
- [ ] Final Build Test
  ```bash
  npm run build
  npm run start
  ```
  - [ ] Build completes successfully
  - [ ] Server starts without errors
  - [ ] All pages load correctly

- [ ] Verify All Credentials
  - [ ] `.env.production` has real values
  - [ ] Stripe key looks correct (pk_live_...)
  - [ ] OAuth IDs configured
  - [ ] API URL points to production
  - [ ] Sentry DSN configured

**Afternoon (4 hours)**
- [ ] Final Smoke Test
  - [ ] Navigate to homepage
  - [ ] Load a product
  - [ ] Try search
  - [ ] Check cart
  - [ ] Try checkout (sandbox)
  - [ ] Verify analytics recording
  - [ ] Check error logs (should be quiet)

- [ ] Team Walkthrough
  - [ ] Demo to stakeholders
  - [ ] Get sign-off on fixes
  - [ ] Confirm go-live decision
  - [ ] Document any last-minute issues

**End of Day - GO-LIVE READY!**
- [ ] All 8 tasks completed ✅
- [ ] All tests passing ✅
- [ ] All docs ready ✅
- [ ] Build production-ready ✅
- [ ] Team approved ✅

---

## 📊 DAILY PROGRESS TRACKING

### Week 1 Daily Log

**Mar 5 (Monday)**
- Tasks: Task 1.1, 1.2
- Time Spent: 4 hours
- Status: ✅ On track
- Blockers: None
- Notes: Type definitions created successfully

**Mar 6 (Tuesday)**
- Tasks: Task 1.3, 1.4, 1.5
- Time Spent: 4 hours
- Status: ✅ On track
- Blockers: None
- Notes: All API endpoints updated, tests passing

**Mar 7 (Wednesday)**
- Tasks: Task 2 (Day 1)
- Time Spent: 4 hours
- Status: _____
- Blockers: _____
- Notes: _____

**Mar 8 (Thursday)**
- Tasks: Task 2 (Day 2), 3
- Time Spent: 4 hours
- Status: _____
- Blockers: _____
- Notes: _____

**Mar 9 (Friday)**
- Tasks: Task 2 (Day 3)
- Time Spent: 4 hours
- Status: _____
- Blockers: _____
- Notes: _____

**Mar 10 (Saturday)**
- Tasks: Task 4 (CSRF)
- Time Spent: 3 hours
- Status: _____
- Blockers: _____
- Notes: _____

**Mar 11 (Sunday)**
- Tasks: Task 5 (Consent)
- Time Spent: 3 hours
- Status: _____
- Blockers: _____
- Notes: _____

### Week 2 Summary
- [ ] Task 6 (Performance): ___% complete
- [ ] Task 7 (Testing): ___% complete
- Bugs Found: ___
- Tests Written: ___
- Coverage: ___%

### Week 3 Summary
- [ ] Task 8 (Docs): ___% complete
- [ ] Final Testing: ___% complete
- [ ] All Issues Fixed: Yes / No
- [ ] Launch Ready: Yes / No

---

## 🚨 ISSUE LOG

When you encounter a problem, log it here:

| Date | Issue | Severity | Assigned | Status |
|------|-------|----------|----------|--------|
| Mar ____ | ________ | 🔴/🟠/🟡 | ________ | Open/Fixed |
| Mar ____ | ________ | 🔴/🟠/🟡 | ________ | Open/Fixed |

---

## 🎯 QUICK REFERENCE

### Critical Commands

```bash
# Build & Run
npm run dev              # Start development
npm run build           # Production build
npm run start           # Run production
npm test               # Run tests
npx playwright test    # Run E2E tests

# Commit Changes
git add .
git commit -m "task: description"
git log                # View commits

# Check Status
npm run build          # Verify no errors
git status            # See changes
npm test              # Verify tests pass
```

### Daily Checklist Template

```
[✓] Morning standup - what to do today
[_] Task checklist items (see above)
[_] npm run build before lunch
[_] Mid-day sync if blocked
[_] npm run build before leaving
[_] Commit daily progress
[_] Update this checklist
[_] Evening standup summary
```

---

**Print this page and use daily!**  
**Tick off items as you complete them**  
**Report blockers immediately**  

**Last Updated:** March 5, 2026  
**Weekly Reviews:** Every Friday 4:00 PM

