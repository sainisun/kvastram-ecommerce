import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

// Define a simple Spec
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Kvastram API",
    description: "E-commerce Platform API Documentation",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local Server",
    },
  ],
});

// Mount Scalar UI
app.get(
  "/reference",
  apiReference({
    spec: {
      url: "/docs/doc",
    },
  }),
);

// Example Documented Route (We will gradually move routes here or refactor existing ones)
const healthRoute = createRoute({
  method: "get",
  path: "/health-check",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            message: z.string(),
          }),
        },
      },
      description: "Health check endpoint",
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    status: "ok",
    message: "Docs are working!",
  });
});

export default app;
