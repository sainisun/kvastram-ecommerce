import { Hono } from 'hono';
import { verifyAdmin } from '../middleware/auth';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { generateInvoice } from '../services/pdf-service';
import { orderService } from '../services/order-service';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/error-handler';
import { successResponse, paginatedResponse } from '../utils/api-response';

const ordersRouter = new Hono();

// Apply admin authentication to all routes
ordersRouter.use('*', verifyAdmin);

// GET /orders - List all orders with filters
ordersRouter.get(
  '/',
  asyncHandler(async (c) => {
    const filters = c.req.query();
    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 20;

    const result = await orderService.listOrders({
      page,
      limit,
      search: filters.search,
      status: filters.status,
      date_from: filters.date_from,
      date_to: filters.date_to,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order as 'asc' | 'desc',
    });

    // Fix: Access total from result.pagination.total
    const total = result.pagination?.total || 0;

    return paginatedResponse(
      c,
      result.orders,
      {
        offset: (page - 1) * limit,
        limit,
        total,
      },
      'Orders retrieved successfully'
    );
  })
);

// GET /orders/stats/overview - Get order statistics
ordersRouter.get(
  '/stats/overview',
  asyncHandler(async (c) => {
    const stats = await orderService.getStatsOverview();
    return successResponse(c, stats, 'Order statistics retrieved successfully');
  })
);

// GET /orders/:id/invoice - Download invoice PDF
ordersRouter.get(
  '/:id/invoice',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = await orderService.getInvoiceData(id);

    if (!data) throw new NotFoundError('Order not found');

    const pdfBuffer = await generateInvoice(data.order, data.items);

    return c.body(pdfBuffer as any, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.order.order_number}.pdf"`,
    });
  })
);

// GET /orders/:id - Get single order details
ordersRouter.get(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = await orderService.getOrder(id);

    if (!data) throw new NotFoundError('Order not found');

    return successResponse(c, data, 'Order details retrieved successfully');
  })
);

// PUT /orders/:id/status - Update order status
const UpdateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

ordersRouter.put(
  '/:id/status',
  zValidator('json', UpdateStatusSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const { status } = (c.req as any).valid('json');

    const updated = await orderService.updateStatus(id, status);

    if (!updated) throw new NotFoundError('Order not found');

    return successResponse(
      c,
      { order: updated },
      `Order status updated to ${status}`
    );
  })
);

// POST /orders/bulk-update-status - Bulk update order status
const BulkUpdateStatusSchema = z.object({
  order_ids: z.array(z.string()),
  status: z.enum([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

ordersRouter.post(
  '/bulk-update-status',
  zValidator('json', BulkUpdateStatusSchema),
  asyncHandler(async (c) => {
    const { order_ids, status } = (c.req as any).valid('json');

    const count = await orderService.bulkUpdateStatus(order_ids, status);

    return successResponse(
      c,
      {
        updated_count: count,
        order_ids,
      },
      `${count} orders updated to ${status}`
    );
  })
);

// DELETE /orders/:id - Delete order
ordersRouter.delete(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    await orderService.deleteOrder(id);
    return successResponse(
      c,
      { id, deleted: true },
      'Order deleted successfully'
    );
  })
);

export default ordersRouter;
