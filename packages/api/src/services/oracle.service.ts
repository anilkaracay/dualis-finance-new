import { createChildLogger } from '../config/logger.js';
import type {
  OraclePriceParams,
  OraclePriceItem,
  OraclePriceWithHistory,
} from '@dualis/shared';

const log = createChildLogger('oracle-service');

const now = new Date().toISOString();

const MOCK_PRICES: OraclePriceItem[] = [
  {
    asset: 'BTC',
    quoteCurrency: 'USD',
    price: 62_450,
    confidence: 0.9995,
    source: 'Chainlink Data Streams',
    timestamp: now,
    change24h: 1_280,
    change24hPercent: 2.09,
  },
  {
    asset: 'ETH',
    quoteCurrency: 'USD',
    price: 3_420,
    confidence: 0.9993,
    source: 'Chainlink Data Streams',
    timestamp: now,
    change24h: -45.2,
    change24hPercent: -1.3,
  },
  {
    asset: 'USDC',
    quoteCurrency: 'USD',
    price: 1.0,
    confidence: 0.9999,
    source: 'Chainlink Data Streams',
    timestamp: now,
    change24h: 0.0001,
    change24hPercent: 0.01,
  },
  {
    asset: 'USDT',
    quoteCurrency: 'USD',
    price: 0.9998,
    confidence: 0.9998,
    source: 'Chainlink Data Streams',
    timestamp: now,
    change24h: -0.0002,
    change24hPercent: -0.02,
  },
  {
    asset: 'SPY',
    quoteCurrency: 'USD',
    price: 478.5,
    confidence: 0.9997,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: 3.25,
    change24hPercent: 0.68,
  },
  {
    asset: 'AAPL',
    quoteCurrency: 'USD',
    price: 182.0,
    confidence: 0.9996,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: -1.45,
    change24hPercent: -0.79,
  },
  {
    asset: 'TSLA',
    quoteCurrency: 'USD',
    price: 250.0,
    confidence: 0.9994,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: 5.8,
    change24hPercent: 2.37,
  },
  {
    asset: 'US-T10Y',
    quoteCurrency: 'USD',
    price: 96.45,
    confidence: 0.9999,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: -0.12,
    change24hPercent: -0.12,
  },
  {
    asset: 'T-BILL',
    quoteCurrency: 'USD',
    price: 1.0,
    confidence: 0.9999,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: 0.0,
    change24hPercent: 0.0,
  },
  {
    asset: 'DUAL',
    quoteCurrency: 'USD',
    price: 2.45,
    confidence: 0.998,
    source: 'Canton Oracle Network',
    timestamp: now,
    change24h: 0.12,
    change24hPercent: 5.15,
  },
];

function generatePriceHistory(
  asset: string,
  period: string
): Array<{ timestamp: string; price: number }> {
  const priceItem = MOCK_PRICES.find((p) => p.asset === asset);
  if (!priceItem) return [];

  const periodHours: Record<string, number> = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720,
  };
  const hours = periodHours[period] ?? 24;
  const intervalMs = (hours * 3_600_000) / 100; // 100 data points
  const nowMs = Date.now();
  const history: Array<{ timestamp: string; price: number }> = [];

  for (let i = 100; i >= 0; i--) {
    const ts = new Date(nowMs - i * intervalMs);
    const volatility = priceItem.price > 100 ? 0.005 : 0.001;
    const jitter = 1 + Math.sin(i * 0.15) * volatility + (Math.random() - 0.5) * volatility;
    history.push({
      timestamp: ts.toISOString(),
      price: Number((priceItem.price * jitter).toFixed(4)),
    });
  }

  return history;
}

export function getAllPrices(): OraclePriceItem[] {
  log.debug('Getting all oracle prices');
  return MOCK_PRICES.map((p) => ({
    ...p,
    timestamp: new Date().toISOString(),
  }));
}

export function getAssetPrice(
  asset: string,
  params: OraclePriceParams
): OraclePriceItem | OraclePriceWithHistory {
  log.debug({ asset, params }, 'Getting asset price');

  const priceItem = MOCK_PRICES.find(
    (p) => p.asset.toLowerCase() === asset.toLowerCase()
  );
  if (!priceItem) {
    throw new Error(`Asset ${asset} not found`);
  }

  const current: OraclePriceItem = {
    ...priceItem,
    timestamp: new Date().toISOString(),
  };

  if (params.history) {
    return {
      current,
      history: generatePriceHistory(asset, params.period ?? '24h'),
    };
  }

  return current;
}
