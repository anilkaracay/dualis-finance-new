'use client';

import { create } from 'zustand';

interface PriceEntry {
  price: number;
  timestamp: number;
  change24h: number;
}

interface PriceState {
  prices: Record<string, PriceEntry>;
}

interface PriceActions {
  updatePrice: (asset: string, price: number, timestamp: number, change24h: number) => void;
  getPrice: (asset: string) => number;
}

const INITIAL_PRICES: Record<string, PriceEntry> = {
  USDC: { price: 1.0, timestamp: Date.now(), change24h: 0.01 },
  wBTC: { price: 97_234.56, timestamp: Date.now(), change24h: 1.29 },
  ETH: { price: 3_456.78, timestamp: Date.now(), change24h: -0.85 },
  CC: { price: 2.30, timestamp: Date.now(), change24h: 3.45 },
  'T-BILL-2026': { price: 99.87, timestamp: Date.now(), change24h: 0.02 },
  'SPY-2026': { price: 512.45, timestamp: Date.now(), change24h: 0.67 },
  DUAL: { price: 1.23, timestamp: Date.now(), change24h: -2.15 },
};

export const usePriceStore = create<PriceState & PriceActions>()((set, get) => ({
  prices: INITIAL_PRICES,

  updatePrice: (asset, price, timestamp, change24h) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [asset]: { price, timestamp, change24h },
      },
    })),

  getPrice: (asset) => {
    const entry = get().prices[asset];
    return entry?.price ?? 0;
  },
}));
