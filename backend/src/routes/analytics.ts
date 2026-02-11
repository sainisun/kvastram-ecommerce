import { Hono } from "hono";
import { analyticsService } from "../services/analytics-service";
import { verifyAuth } from "../middleware/auth";

const analyticsRouter = new Hono();

// GET /analytics/overview
analyticsRouter.get("/overview", verifyAuth, async (c) => {
  try {
    const overview = await analyticsService.getOverview();
    return c.json(overview);
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return c.json({ error: "Failed to fetch overview" }, 500);
  }
});

// GET /analytics/sales-trend
analyticsRouter.get("/sales-trend", verifyAuth, async (c) => {
  const days = c.req.query("days") ? parseInt(c.req.query("days")!) : 30;
  try {
    const trend = await analyticsService.getSalesTrend(days);
    return c.json(trend);
  } catch (error) {
    console.error("Error fetching sales trend:", error);
    return c.json({ error: "Failed to fetch sales trend" }, 500);
  }
});

// GET /analytics/orders-by-status
analyticsRouter.get("/orders-by-status", verifyAuth, async (c) => {
  try {
    const statusData = await analyticsService.getOrdersByStatus();
    return c.json(statusData);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return c.json({ error: "Failed to fetch orders by status" }, 500);
  }
});

export default analyticsRouter;
