import { Hono } from 'hono';
import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { security_events } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';

const router = new Hono();

router.get('/', verifyAdmin, async (c) => {
  try {
    const { severity = 'all', search = '', event = '' } = c.req.query();
    const conditions = [];

    if (severity && severity !== 'all') {
      conditions.push(eq(security_events.severity, severity));
    }

    if (event) {
      conditions.push(eq(security_events.event, event));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(security_events.event, pattern),
          ilike(security_events.path, pattern),
          ilike(security_events.ip_address, pattern),
          sql`cast(${security_events.details} as text) ilike ${pattern}`
        )
      );
    }

    const rows = await db
      .select()
      .from(security_events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(security_events.created_at))
      .limit(300);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        warn: sql<number>`count(*) filter (where ${security_events.severity} = 'warn')`,
        error: sql<number>`count(*) filter (where ${security_events.severity} = 'error')`,
      })
      .from(security_events);

    const [last24hStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, since));

    const [topEvent] = await db
      .select({
        event: security_events.event,
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, since))
      .groupBy(security_events.event)
      .orderBy(sql`count(*) desc`, desc(security_events.event))
      .limit(1);

    return c.json({
      events: rows.map((row) => ({
        ...row,
        details:
          row.details && typeof row.details === 'string'
            ? JSON.parse(row.details)
            : row.details,
      })),
      stats: {
        total: Number(stats?.total || 0),
        warn: Number(stats?.warn || 0),
        error: Number(stats?.error || 0),
        last_24h: Number(last24hStats?.count || 0),
        top_event_24h: topEvent?.event || null,
        top_event_count_24h: Number(topEvent?.count || 0),
      },
    });
  } catch (error) {
    console.error('[Admin Security Events] GET error:', error);
    return c.json({ error: 'Failed to fetch security events' }, 500);
  }
});

export default router;
