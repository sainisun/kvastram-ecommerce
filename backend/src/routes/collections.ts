import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { verifyAuth } from "../middleware/auth";
import { db } from "../db/client";
import { product_collections } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const collectionsRouter = new Hono();

const CollectionSchema = z.object({
  title: z.string().min(1),
  handle: z.string().min(1),
  image: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /collections
collectionsRouter.get("/", async (c) => {
  try {
    const list = await db
      .select()
      .from(product_collections)
      .orderBy(desc(product_collections.created_at));
    return c.json({ collections: list });
  } catch (error: any) {
    console.error('[Collections] GET / error:', error?.message || error);
    console.error('[Collections] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return c.json({ error: "Failed to fetch collections", details: error?.message }, 500);
  }
});

// GET /collections/:id
collectionsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const collection = await db.query.product_collections.findFirst({
      where: eq(product_collections.id, id),
    });

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    return c.json({ collection });
  } catch (error) {
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

// POST /collections
collectionsRouter.post(
  "/",
  verifyAuth,
  zValidator("json", CollectionSchema),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const [newCollection] = await db
        .insert(product_collections)
        .values({
          title: data.title,
          handle: data.handle,
          image: data.image,
          metadata: data.metadata,
        })
        .returning();

      return c.json({ collection: newCollection }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message || "Failed to create collection" },
        500,
      );
    }
  },
);

// PUT /collections/:id
collectionsRouter.put(
  "/:id",
  verifyAuth,
  zValidator("json", CollectionSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    try {
      const [updatedCollection] = await db
        .update(product_collections)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(product_collections.id, id))
        .returning();

      return c.json({ collection: updatedCollection });
    } catch (error: any) {
      return c.json(
        { error: error.message || "Failed to update collection" },
        500,
      );
    }
  },
);

// DELETE /collections/:id
collectionsRouter.delete("/:id", verifyAuth, async (c) => {
  const id = c.req.param("id");
  try {
    await db.delete(product_collections).where(eq(product_collections.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to delete collection" }, 500);
  }
});

export default collectionsRouter;
