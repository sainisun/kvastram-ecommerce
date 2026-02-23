# Kvastram Platform - Cleanup & Optimization Plan

## 📊 Current Project Size Analysis

| Directory               | Size        | Status                      |
| ----------------------- | ----------- | --------------------------- |
| storefront/.next        | 886 MB      | 🗑️ Can be regenerated       |
| storefront/node_modules | 529 MB      | 🗑️ Can be reinstalled       |
| admin/node_modules      | 482 MB      | 🗑️ Can be reinstalled       |
| admin/.next             | 300 MB      | 🗑️ Can be regenerated       |
| backend/node_modules    | 165 MB      | 🗑️ Can be reinstalled       |
| root node_modules       | 20 MB       | 🗑️ Can be reinstalled       |
| **TOTAL**               | **~2.4 GB** | **~2.3 GB cleanable (97%)** |

---

## 🧹 Phase 1: Size Optimization (Target: ~50-100 MB)

### Step 1.1: Remove Build Outputs

```bash
# Remove .next build folders (can be regenerated with npm run build)
rm -rf storefront/.next
rm -rf admin/.next
```

### Step 1.2: Remove node

# Remove all_modules

```bash node_modules (can be reinstalled with npm install)
rm -rf storefront/node_modules
rm -rf admin/node_modules
rm -rf backend/node_modules
rm -rf node_modules
```

### Step 1.3: Add to .gitignore

Ensure these are in `.gitignore`:

```
# Build outputs
.next/
build/
dist/

# Dependencies
node_modules/
```

### Expected Result: ~50-100 MB (source code only)

---

## ✅ Phase 2: Error-Free Project (100% Safe)

### Step 2.1: Install Dependencies Fresh

```bash
# Root
npm install

# Backend
cd backend && npm install

# Admin
cd admin && npm install

# Storefront
cd storefront && npm install
```

### Step 2.2: Run TypeScript Check

```bash
# Backend
cd backend && npx tsc --noEmit

# Admin
cd admin && npx tsc --noEmit

# Storefront
cd storefront && npx tsc --noEmit
```

### Step 2.3: Fix TypeScript Errors

Address any type errors found in Step 2.2

### Step 2.4: Run Linting

```bash
# Backend
cd backend && npx eslint src/

# Admin
cd admin && npx eslint src/

# Storefront
cd storefront && npx eslint src/
```

### Step 2.5: Test Build

```bash
# Build each project
npm run build
```

---

## 📋 Quick Cleanup Script

Run this single command to clean everything:

```bash
# From project root
rm -rf storefront/.next admin/.next
rm -rf storefront/node_modules admin/node_modules backend/node_modules node_modules

# Verify .gitignore has the right entries
echo -e "\n.next/\nnode_modules/\ndist/\nbuild/" >> .gitignore
```

---

## 🔄 Rebuild Commands

After cleanup, rebuild everything:

```bash
# Install all dependencies
npm install && cd backend && npm install && cd ../admin && npm install && cd ../storefront && npm install && cd ..

# Build all projects
cd backend && npm run build
cd admin && npm run build
cd storefront && npm run build
```

---

## ⚠️ Important Notes

1. **Never commit node_modules or .next** - Add to `.gitignore`
2. **Always run npm install after cloning** - Dependencies are not in git
3. **Build outputs are environment-specific** - Don't commit them

---

## 📈 Size Reduction Summary

| Metric          | Before  | After       |
| --------------- | ------- | ----------- |
| Total Size      | ~2.4 GB | ~50-100 MB  |
| Git Repo        | ~2.4 GB | ~50-100 MB  |
| Clean reduction | -       | **~95-97%** |
