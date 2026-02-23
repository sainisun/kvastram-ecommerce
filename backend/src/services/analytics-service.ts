import { db } from '../db/client';
import { orders } from '../db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';

export class AnalyticsService {
  async getOverview() {
    try {
      // Run parallel queries for speed
      const [totalSalesResult, totalOrdersResult, averageOrderValueResult] =
        await Promise.all([
          // Total Sales
          db
            .select({ value: sql<number>`sum(${orders.total})` })
            .from(orders)
            .where(eq(orders.payment_status, 'captured')),
          // Total Orders
          db.select({ value: sql<number>`count(*)` }).from(orders),
          // Average Order Value (AOV)
          db
            .select({ value: sql<number>`avg(${orders.total})` })
            .from(orders)
            .where(eq(orders.payment_status, 'captured')),
        ]);

      return {
        total_sales: totalSalesResult[0]?.value || 0,
        total_orders: totalOrdersResult[0]?.value || 0,
        average_order_value: Math.round(averageOrderValueResult[0]?.value || 0),
      };
    } catch (error: unknown) {
      console.error('[AnalyticsService] Error in getOverview:', error);
      throw new Error('Failed to fetch analytics overview');
    }
  }

  async getSalesTrend(days = 30) {
    // Validate input - clamp to safe range, never use raw string in SQL
    const validatedDays = Math.max(
      1,
      Math.min(365, parseInt(days.toString(), 10) || 30)
    );

    try {
      // Parameterized: validatedDays is passed as value, not concatenated
      const result = await db.execute(sql`
                SELECT
                    date_trunc('day', created_at) as date,
                    SUM(total) as sales,
                    COUNT(*) as orders
                FROM orders
                WHERE created_at >= NOW() - ${validatedDays} * INTERVAL '1 day'
                AND payment_status = 'captured'
                GROUP BY date_trunc('day', created_at)
                ORDER BY date_trunc('day', created_at) ASC
            `);

      return result.map((row: any) => ({
        date: new Date(row.date).toISOString().split('T')[0],
        sales: Number(row.sales),
        orders: Number(row.orders),
      }));
    } catch (error: unknown) {
      console.error('[AnalyticsService] Error in getSalesTrend:', error);
      throw new Error('Failed to fetch sales trend');
    }
  }

  async getOrdersByStatus() {
    try {
      const result = await db
        .select({
          status: orders.status,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .groupBy(orders.status);

      return result;
    } catch (error: unknown) {
      console.error('[AnalyticsService] Error in getOrdersByStatus:', error);
      throw new Error('Failed to fetch orders by status');
    }
  }
}

export const analyticsService = new AnalyticsService();
