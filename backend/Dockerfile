# ---- Builder stage: compile TypeScript → dist/ ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Bundle server and migration script; externalize native/binary modules
RUN npm run build

# ---- Runner stage: production image (no devDependencies) ----
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies so externalized native modules are available
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Run migrations then start server — both are pre-compiled, no tsx needed
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
