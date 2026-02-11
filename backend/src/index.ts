import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { csrf } from "hono/csrf";
import {
  authLimiter,
  checkoutLimiter,
  generalLimiter,
} from "./middleware/rate-limiter";
import "dotenv/config";

// Import db and test connection
import { healthCheck } from "./db/client";

// Import error handler
import { errorHandler } from "./middleware/error-handler";
import { successResponse } from "./utils/api-response";

// Import routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import regionRoutes from "./routes/regions";
import uploadRoutes from "./routes/upload";
import customersRouter from "./routes/customers";
import settingsRoutes from "./routes/settings";
import marketingRoutes from "./routes/marketing";
import bannerRoutes from "./routes/banners";
import postRoutes from "./routes/posts";
import pageRoutes from "./routes/pages";
import categoriesRoutes from "./routes/categories";
import tagsRoutes from "./routes/tags";

import analyticsRoutes from "./routes/analytics";
import auth2faRoutes from "./routes/auth-2fa";
import storeAuthRoutes from "./routes/store/auth";
import storeCustomersRouter from "./routes/store/customers";
import checkoutRoutes from "./routes/store/checkout";
import paymentRoutes from "./routes/store/payments";
import wholesaleRoutes from "./routes/wholesale";
import reviewsRoutes from "./routes/reviews";
import contactRoutes from "./routes/contact";
import newsletterRoutes from "./routes/newsletter";

import docsApp from "./docs";

const app = new Hono();

// Security & Logging Middleware
app.use("*", secureHeaders());
app.use("*", logger());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
];
app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// 🔒 FIX-004: CSRF Protection for state-changing operations
// Only apply in production or when Origin header is present
app.use("/store/checkout/*", csrf({
  origin: allowedOrigins,
}));
app.use("/store/payments/*", csrf({
  origin: allowedOrigins,
}));

// Health Check Endpoint
app.get("/health", async (c) => {
  const dbHealthy = await healthCheck(1, 0);
  const status = dbHealthy ? 200 : 503;

  return successResponse(
    c,
    {
      status: dbHealthy ? "healthy" : "unhealthy",
      database: dbHealthy ? "connected" : "disconnected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
    },
    dbHealthy ? "Service is healthy" : "Service is experiencing issues",
    status,
  );
});

// API Info Endpoint
app.get("/", (c) => {
  return successResponse(
    c,
    {
      name: "Kvastram API",
      version: "1.0.0",
      description: "E-commerce platform API",
      documentation: "/api/docs",
      endpoints: {
        auth: "/auth",
        products: "/products",
        orders: "/orders",
        customers: "/customers",
        store: "/store",
      },
    },
    "Welcome to Kvastram API",
  );
});

// Rate Limiting Configuration (Tiered)
// 1. Auth Limits (Strict)
app.use("/auth/*", authLimiter);
app.use("/auth/2fa/*", authLimiter);
app.use("/store/auth/*", authLimiter);

// 2. Checkout & Payment Limits (Very Strict)
app.use("/store/checkout/*", checkoutLimiter);
app.use("/store/payments/*", checkoutLimiter);

// 3. General API Limits (For browsing/products/etc)
// Exempting specific high-volume public endpoints or specific assets if needed
// Applying to all other known API routes
// Note: We mount middleware on specific path patterns to avoid blocking static assets or health checks
const generalApiRoutes = [
  "/products/*",
  "/orders/*",
  "/customers/*",
  "/regions/*",
  "/upload/*",
  "/settings/*",
  "/marketing/*",
  "/banners/*",
  "/posts/*",
  "/pages/*",
  "/categories/*",
  "/tags/*",
  "/analytics/*",
  "/wholesale/*",
  "/reviews/*",
];

for (const route of generalApiRoutes) {
  app.use(route, generalLimiter);
}

// API Routes
app.route("/auth", authRoutes);
app.route("/products", productRoutes);
app.route("/orders", orderRoutes);
app.route("/regions", regionRoutes);
app.route("/upload", uploadRoutes);
app.route("/customers", customersRouter);
app.route("/settings", settingsRoutes);
app.route("/marketing", marketingRoutes);
app.route("/banners", bannerRoutes);
app.route("/posts", postRoutes);
app.route("/pages", pageRoutes);
app.route("/categories", categoriesRoutes);
app.route("/tags", tagsRoutes);

app.route("/analytics", analyticsRoutes);
app.route("/auth/2fa", auth2faRoutes);

// Wholesale Routes
app.route("/wholesale", wholesaleRoutes);

// Contact Form Route
app.route("/contact", contactRoutes);

// Newsletter Route
app.route("/newsletter", newsletterRoutes);

// Store Routes (Customer-facing)
app.route("/store/auth", storeAuthRoutes);
app.route("/store/customers", storeCustomersRouter);
app.route("/store/checkout", checkoutRoutes);
app.route("/store/payments", paymentRoutes);
app.route("/reviews", reviewsRoutes);

// Documentation Routes
app.route("/docs", docsApp);

// 404 Handler
app.notFound((c) => {
  return successResponse(c, null, "Not Found", 404);
});

// Global Error Handler
app.onError(errorHandler);

const port = Number(process.env.PORT) || 4000;

console.log(`🚀 Server starting on port ${port}`);
console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
if (process.env.NODE_ENV !== "production") {
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(", ")}`);
}

serve({
  fetch: app.fetch,
  port,
});
