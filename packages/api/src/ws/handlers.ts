import type { WebSocket } from '@fastify/websocket';
import type {
  WsAuthSuccess,
  WsAuthError,
  WsSubscribedMessage,
  WsUnsubscribedMessage,
  WsErrorMessage,
  WsPongMessage,
} from '@dualis/shared';
import jsonwebtoken from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createChildLogger } from '../config/logger.js';
import { channelManager } from './channels.js';

const log = createChildLogger('ws-handlers');

/** Decoded JWT payload structure used by the Dualis auth system. */
interface JwtPayload {
  partyId: string;
  walletAddress?: string;
  tier?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Serialise and send a typed server message over the socket. */
function send(
  socket: WebSocket,
  msg: WsAuthSuccess | WsAuthError | WsSubscribedMessage | WsUnsubscribedMessage | WsErrorMessage | WsPongMessage,
): void {
  socket.send(JSON.stringify(msg));
}

// ---------------------------------------------------------------------------
// Message handlers
// ---------------------------------------------------------------------------

/**
 * Handle an `auth` message.
 *
 * Verifies the JWT token and, on success, marks the socket as authenticated
 * within the {@link channelManager}.
 */
export function handleAuth(socket: WebSocket, token: string): void {
  try {
    const decoded = jsonwebtoken.verify(token, env.JWT_SECRET) as JwtPayload;
    channelManager.authenticate(socket, decoded.partyId);

    send(socket, { type: 'auth:success', partyId: decoded.partyId });
    log.info({ partyId: decoded.partyId }, 'WebSocket authenticated');
  } catch {
    send(socket, { type: 'auth:error', message: 'Invalid token' });
    log.warn('WebSocket auth failed');
  }
}

/**
 * Handle a `subscribe` message.
 *
 * Attempts to subscribe the socket to the requested channel. If the channel
 * is private and the socket lacks the necessary permissions, an error is returned.
 */
export function handleSubscribe(socket: WebSocket, channel: string): void {
  const success = channelManager.subscribe(channel, socket);

  if (success) {
    send(socket, { type: 'subscribed', channel });
  } else {
    send(socket, {
      type: 'error',
      message: `Cannot subscribe to ${channel}`,
      code: 'FORBIDDEN',
    });
  }
}

/**
 * Handle an `unsubscribe` message.
 *
 * Removes the socket from the given channel and acknowledges the operation.
 */
export function handleUnsubscribe(socket: WebSocket, channel: string): void {
  channelManager.unsubscribe(channel, socket);
  send(socket, { type: 'unsubscribed', channel });
}

/**
 * Handle a `ping` message from the client.
 *
 * Responds with a `pong` containing the server timestamp so the client can
 * measure round-trip latency.
 */
export function handlePing(socket: WebSocket): void {
  send(socket, { type: 'pong', ts: new Date().toISOString() });
}
