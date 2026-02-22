// ============================================================================
// Binance WebSocket Price Source
// ============================================================================

import { createChildLogger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import type { RawPrice } from '../types.js';
import { BINANCE_SYMBOL_MAP, BINANCE_REVERSE_MAP } from '../types.js';

const log = createChildLogger('oracle-binance');

/** Latest price from Binance per our asset symbol */
const latestPrices = new Map<string, RawPrice>();

/** Active WebSocket connection (uses Node.js native WebSocket) */
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

interface BinanceTrade {
  /** Event type */
  e: string;
  /** Symbol (lowercase) */
  s: string;
  /** Price */
  p: string;
  /** Event time */
  E: number;
}

/**
 * Create a Binance WebSocket stream for real-time trade prices.
 * Uses Node.js native WebSocket (Node 22+).
 * Returns a handle with `close()` to shut down the connection.
 */
export function createBinanceWsStream(
  assets: string[],
  onPrice: (p: RawPrice) => void,
): { close(): void } {
  if (!env.BINANCE_WS_ENABLED) {
    log.info('Binance WS disabled by config');
    return { close: () => {} };
  }

  const streams: string[] = [];
  const streamSet = new Set<string>();

  for (const asset of assets) {
    const symbol = BINANCE_SYMBOL_MAP[asset];
    if (symbol && !streamSet.has(symbol)) {
      streams.push(`${symbol}@trade`);
      streamSet.add(symbol);
    }
  }

  if (streams.length === 0) {
    log.info('No Binance-compatible assets provided');
    return { close: () => {} };
  }

  function connect(): void {
    const url = `${env.BINANCE_WS_URL}/${streams.join('/')}`;
    log.info({ url, streams: streams.length }, 'Connecting to Binance WS');

    ws = new WebSocket(url);

    ws.onopen = (): void => {
      log.info('Binance WS connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event: MessageEvent): void => {
      try {
        const trade = JSON.parse(String(event.data)) as BinanceTrade;
        if (trade.e !== 'trade') return;

        const symbol = trade.s.toLowerCase();
        const ourAsset = BINANCE_REVERSE_MAP[symbol];
        if (!ourAsset) return;

        const price: RawPrice = {
          asset: ourAsset,
          price: parseFloat(trade.p),
          source: 'Binance',
          timestamp: trade.E,
          confidence: 0.98,
        };

        latestPrices.set(ourAsset, price);
        onPrice(price);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (): void => {
      log.warn('Binance WS closed');
      scheduleReconnect();
    };

    ws.onerror = (): void => {
      log.warn('Binance WS error');
    };
  }

  function scheduleReconnect(): void {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      log.error('Max Binance WS reconnect attempts reached');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30_000);
    reconnectAttempts++;
    log.info({ attempt: reconnectAttempts, delayMs: delay }, 'Scheduling Binance WS reconnect');
    reconnectTimer = setTimeout(connect, delay);
  }

  connect();

  return {
    close(): void {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent reconnect
      if (ws) {
        ws.close();
        ws = null;
      }
      latestPrices.clear();
      log.info('Binance WS closed');
    },
  };
}

/** Get the latest cached prices from Binance WS stream */
export function getBinanceLatestPrices(): RawPrice[] {
  return [...latestPrices.values()];
}
