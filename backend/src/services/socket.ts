import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';

export let io: SocketServer | null = null;

export function initSocketServer(
  httpServer: HttpServer,
  allowedOrigins: string[]
): SocketServer {
  io = new SocketServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('subscribe:inventory', ({ variantId }: { variantId: string }) => {
      socket.join(`inventory:${variantId}`);
    });

    socket.on(
      'unsubscribe:inventory',
      ({ variantId }: { variantId: string }) => {
        socket.leave(`inventory:${variantId}`);
      }
    );

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
}

/**
 * Broadcast a real-time inventory update to all clients subscribed to a variant.
 * Call this whenever inventory_quantity changes (e.g. after an order is placed).
 */
export function broadcastInventoryUpdate(
  variantId: string,
  productId: string,
  quantity: number
): void {
  io?.to(`inventory:${variantId}`).emit('inventory:update', {
    variantId,
    productId,
    quantity,
    timestamp: new Date().toISOString(),
  });
}
