import { Hono } from "hono";
import { verifyAdmin } from "../middleware/auth"; // BUG-011 FIX: was verifyAuth
import { z } from "zod";
import { settingService, SettingSchema } from "../services/setting-service";

const settingsRouter = new Hono();

// Get all settings
settingsRouter.get("/", verifyAdmin, async (c) => {
  try {
    const allSettings = await settingService.getAll();
    return c.json({ settings: allSettings });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get settings by category
settingsRouter.get("/category/:category", verifyAdmin, async (c) => {
  try {
    const category = c.req.param("category");
    const settingsObj = await settingService.getByCategory(category);
    return c.json({ category, settings: settingsObj });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get single setting by key
settingsRouter.get("/:key", verifyAdmin, async (c) => {
  try {
    const key = c.req.param("key");
    const setting = await settingService.getByKey(key);

    if (!setting) return c.json({ error: "Setting not found" }, 404);
    return c.json({ setting });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update or create setting
settingsRouter.put("/:key", verifyAdmin, async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();

    // Basic validation on body structure
    if (!body || typeof body.value === "undefined") {
      return c.json({ error: "Value is required" }, 400);
    }

    const result = await settingService.upsert(key, { key, ...body });
    return c.json({ setting: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Bulk update settings
settingsRouter.post("/bulk", verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { settings: settingsToUpdate } = body;

    if (!settingsToUpdate || typeof settingsToUpdate !== "object") {
      return c.json({ error: "Invalid settings format" }, 400);
    }

    const results = await settingService.bulkUpsert(settingsToUpdate);
    return c.json({
      message: "Settings updated",
      count: results.length,
      settings: results,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete setting
settingsRouter.delete("/:key", verifyAdmin, async (c) => {
  try {
    const key = c.req.param("key");
    const deleted = await settingService.delete(key);

    if (!deleted) return c.json({ error: "Setting not found" }, 404);
    return c.json({ message: "Setting deleted", setting: deleted });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default settingsRouter;
