import type { FastifyInstance } from 'fastify';
import type { WsClientMessage } from '@dualis/shared';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from './channels.js';
import { handleAuth, handleSubscribe, handleUnsubscribe, handlePing } from './handlers.js';

const log = createChildLogger('ws');

/** Auth timeout in milliseconds — clients that fail to authenticate are disconnected. */
const AUTH_TIMEOUT_MS = 30_000;

/** Keepalive ping interval in milliseconds. */
const KEEPALIVE_INTERVAL_MS = 30_000;

/**
 * Registers the WebSocket route on the Fastify instance.
 *
 * Expects the `@fastify/websocket` plugin to already be registered.
 * Clients connect at `GET /v1/ws` and must send an `auth` message within
 * {@link AUTH_TIMEOUT_MS} or the connection is terminated.
 */
export async function wsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/v1/ws', { websocket: true }, (socket, _request) => {
    channelManager.register(socket);
    log.info('WebSocket client connected');

    // -----------------------------------------------------------------------
    // Auth timeout — force disconnect if not authenticated in time
    // -----------------------------------------------------------------------
    const authTimeout = setTimeout(() => {
      if (!channelManager.isAuthenticated(socket)) {
        socket.send(
          JSON.stringify({ type: 'auth:error', message: 'Authentication timeout' }),
        );
        socket.close();
      }
    }, AUTH_TIMEOUT_MS);

    // -----------------------------------------------------------------------
    // Keepalive — send protocol-level pings to detect dead connections
    // -----------------------------------------------------------------------
    const keepalive = setInterval(() => {
      if (socket.readyState === 1) {
        socket.ping();
      }
    }, KEEPALIVE_INTERVAL_MS);

    // -----------------------------------------------------------------------
    // Message handler
    // -----------------------------------------------------------------------
    socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsClientMessage;

        switch (msg.type) {
          case 'auth':
            handleAuth(socket, msg.token);
            break;

          case 'subscribe':
            handleSubscribe(socket, msg.channel);
            break;

          case 'unsubscribe':
            handleUnsubscribe(socket, msg.channel);
            break;

          case 'ping':
            handlePing(socket);
            break;

          default: {
            // Exhaustiveness guard — log and notify the client
            const unknownType: string = (msg as { type: string }).type;
            socket.send(
              JSON.stringify({ type: 'error', message: `Unknown message type: ${unknownType}` }),
            );
          }
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    // -----------------------------------------------------------------------
    // Disconnect cleanup
    // -----------------------------------------------------------------------
    socket.on('close', () => {
      clearTimeout(authTimeout);
      clearInterval(keepalive);
      channelManager.removeSocket(socket);
      log.info('WebSocket client disconnected');
    });

    socket.on('error', (err: Error) => {
      log.error({ err: err.message }, 'WebSocket error');
    });
  });
}
