import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { csrf } from 'hono/csrf';
import {
  authLimiter,
  checkoutLimiter,
  generalLimiter,
} from './middleware/rate-limiter';
import {
  defaultTimeout,
  uploadTimeout,
  webhookTimeout,
} from './middleware/timeout';
import 'dotenv/config';

// Import db and test connection
import { healthCheck } from './db/client';

// Import error handler
import { errorHandler } from './middleware/error-handler';
import { successResponse } from './utils/api-response';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import regionRoutes from './routes/regions';
import uploadRoutes from './routes/upload';
import customersRouter from './routes/customers';
import settingsRoutes from './routes/settings';
import marketingRoutes from './routes/marketing';
import bannerRoutes from './routes/banners';
import postRoutes from './routes/posts';
import pageRoutes from './routes/pages';
import categoriesRoutes from './routes/categories';
import tagsRoutes from './routes/tags';
import collectionsRoutes from './routes/collections';
import testimonialsRoutes from './routes/testimonials';

import analyticsRoutes from './routes/analytics';
import auth2faRoutes from './routes/auth-2fa';
import storeAuthRoutes from './routes/store/auth';
import storeCustomersRouter from './routes/store/customers';
import checkoutRoutes from './routes/store/checkout';
import paymentRoutes from './routes/store/payments';
import wholesaleRoutes from './routes/wholesale';
import wholesaleCustomersRoutes from './routes/wholesale-customers';
import wholesalePricingRoutes from './routes/store/wholesale-pricing';
import wholesaleOrdersRoutes from './routes/store/wholesale-orders';
import adminWholesaleOrdersRoutes from './routes/admin/wholesale-orders';
import adminTiersRoutes from './routes/admin/tiers';
import adminNotificationsRoutes from './routes/admin/notifications';
import whatsappRoutes from './routes/admin/whatsapp';
import reviewsRoutes from './routes/reviews';
import contactRoutes from './routes/contact';
import newsletterRoutes from './routes/newsletter';

import docsApp from './docs';

const app = new Hono();

// 🕵️‍♂️ TRACER: Log every request to confirm frontend-backend communication (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', async (c, next) => {
    const method = c.req.method;
    const path = c.req.path.split('?')[0]; // Mask query params
    const traceId = c.req.header('x-debug-trace') || 'NONE';

    console.log(
      `[TRACER] ${method} ${path} | Trace-ID: ${traceId} | Time: ${new Date().toISOString()}`
    );

    if (traceId !== 'NONE') {
      console.log(
        `[TRACER] ✅ MATCH! Request received from frontend with ID: ${traceId}`
      );
    }

    await next();
  });
}

// Security & Logging Middleware
app.use('*', secureHeaders());
app.use('*', logger());

// OPT-004: Request timeout for all routes (30s default)
app.use('*', defaultTimeout);
// Extended timeout for file uploads and webhooks
app.use('/upload/*', uploadTimeout);
app.use('/store/payments/webhook', webhookTimeout);

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:4000',
  'https://kvastram-ecommerce.vercel.app',
  'https://kvastram-ecommerce-panal.vercel.app',
];
app.use(
  '*',
  cors({
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookies
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'x-debug-trace',
    ],
    exposeHeaders: ['Set-Cookie'], // Allow frontend to receive cookies
  })
);

// 🔒 FIX-004 & FIX-002: CSRF Protection for state-changing operations
// CSRF middleware validates Origin header against allowed origins
// This prevents cross-site request forgery attacks
const csrfProtection = csrf({
  origin: allowedOrigins,
});

// Helper to apply CSRF only to state-changing HTTP methods
const csrfForStateChanging = (routes: string[]) => {
  for (const route of routes) {
    // Apply CSRF middleware to the route - it will check all methods
    // but the browser only sends Origin header for cross-origin requests
    app.use(route, csrfProtection);
  }
};

// Store Routes - Customer checkout and payments (state-changing only)
csrfForStateChanging([
  '/store/checkout/*',
  '/store/payments/create-intent',
  '/store/payments/status/*',
]);

// 🔒 FIX-002: CSRF Protection for Admin Routes
// Protect all admin state-changing operations
// Note: Webhooks (/store/payments/webhook) are EXCLUDED - protected by Stripe signatures
csrfForStateChanging([
  '/products/*',
  '/orders/*',
  '/customers/*',
  '/settings/*',
  '/marketing/*',
  '/banners/*',
  '/posts/*',
  '/pages/*',
  '/categories/*',
  '/tags/*',
  '/collections/*',
  '/wholesale/*',
  '/reviews/*',
  '/testimonials/*',
  '/upload/*',
  '/auth/2fa/*',
]);

// Health Check Endpoint
app.get('/health', async (c) => {
  const dbHealthy = await healthCheck(1, 0);
  const status = dbHealthy ? 200 : 503;

  return successResponse(
    c,
    {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      timestamp: new Date().toISOString(), // OPT-008: Add timestamp for monitoring
    },
    dbHealthy ? 'Service is healthy' : 'Service is experiencing issues',
    status
  );
});

// API Info Endpoint
app.get('/', (c) => {
  return successResponse(
    c,
    {
      name: 'Kvastram API',
      version: '1.0.0',
      description: 'E-commerce platform API',
      documentation: '/api/docs',
      endpoints: {
        auth: '/auth',
        products: '/products',
        orders: '/orders',
        customers: '/customers',
        store: '/store',
      },
    },
    'Welcome to Kvastram API'
  );
});

// Rate Limiting Configuration (Tiered)
// 1. Auth Limits (Strict)
app.use('/auth/*', authLimiter);
app.use('/auth/2fa/*', authLimiter);
app.use('/store/auth/*', authLimiter);

// 2. Checkout & Payment Limits (Very Strict)
app.use('/store/checkout/*', checkoutLimiter);
app.use('/store/payments/*', checkoutLimiter);

// OPT-006: Rate limit public form endpoints (spam prevention)
app.use('/contact/*', authLimiter); // Strict: same as auth
app.use('/newsletter/*', authLimiter); // Strict: same as auth

// 3. General API Limits (For browsing/products/etc)
const generalApiRoutes = [
  '/products/*',
  '/orders/*',
  '/customers/*',
  '/regions/*',
  '/upload/*',
  '/settings/*',
  '/marketing/*',
  '/banners/*',
  '/posts/*',
  '/pages/*',
  '/categories/*',
  '/tags/*',
  '/collections/*',
  '/analytics/*',
  '/wholesale/*',
  '/reviews/*',
  '/testimonials/*',
  '/store/customers/*', // OPT-007: Added missing store customer route
];

for (const route of generalApiRoutes) {
  app.use(route, generalLimiter);
}

// API Routes
app.route('/auth', authRoutes);
app.route('/products', productRoutes);
app.route('/orders', orderRoutes);
app.route('/regions', regionRoutes);
app.route('/upload', uploadRoutes);
app.route('/customers', customersRouter);
app.route('/settings', settingsRoutes);
app.route('/marketing', marketingRoutes);
app.route('/banners', bannerRoutes);
app.route('/posts', postRoutes);
app.route('/pages', pageRoutes);
app.route('/categories', categoriesRoutes);
app.route('/tags', tagsRoutes);
app.route('/collections', collectionsRoutes);
app.route('/testimonials', testimonialsRoutes);

app.route('/analytics', analyticsRoutes);
app.route('/auth/2fa', auth2faRoutes);

// Wholesale Routes
app.route('/wholesale', wholesaleRoutes);
app.route('/wholesale-customers', wholesaleCustomersRoutes);
app.route('/admin/wholesale', adminWholesaleOrdersRoutes);
app.route('/admin/tiers', adminTiersRoutes);
app.route('/admin/notifications', adminNotificationsRoutes);
app.route('/admin/whatsapp', whatsappRoutes);

// Contact Form Route
app.route('/contact', contactRoutes);

// Newsletter Route
app.route('/newsletter', newsletterRoutes);

// Store Routes (Customer-facing)
app.route('/store/auth', storeAuthRoutes);
app.route('/store/customers', storeCustomersRouter);
app.route('/store/checkout', checkoutRoutes);
app.route('/store/payments', paymentRoutes);
app.route('/store/wholesale', wholesalePricingRoutes);
app.route('/store/wholesale', wholesaleOrdersRoutes);
app.route('/reviews', reviewsRoutes);

// Documentation Routes
app.route('/docs', docsApp);

// 404 Handler
app.notFound((c) => {
  return successResponse(c, null, 'Not Found', 404);
});

// Global Error Handler
app.onError(errorHandler);

const port = Number(process.env.PORT) || 4000;

console.log(`Server starting on port ${port}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
if (process.env.NODE_ENV !== 'production') {
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
}

const server = serve({
  fetch: app.fetch,
  port,
});

// OPT-003: Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections are hanging
  const shutdownTimer = setTimeout(() => {
    console.error('⚠️ Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
  shutdownTimer.unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
