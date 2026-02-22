'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  enabled?: boolean;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatWithCommas(num: number, decimals: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function useCountUp({ start = 0, end, duration = 800, decimals = 2, enabled = true }: UseCountUpOptions) {
  const [value, setValue] = useState(enabled ? start : end);
  const prevEndRef = useRef(end);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback((from: number, to: number) => {
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = from + (to - from) * easedProgress;

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    animate(prevEndRef.current !== end ? prevEndRef.current : start, end);
    prevEndRef.current = end;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, start, duration, enabled, animate]);

  return {
    value,
    formattedValue: formatWithCommas(value, decimals),
  };
}
