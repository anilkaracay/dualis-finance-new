'use client';

import { useRef, useEffect, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function CountUpNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
  decimals = 0,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            // Dynamic import to avoid SSR issues
            import('gsap').then(({ default: gsap }) => {
              const obj = { val: 0 };
              gsap.to(obj, {
                val: value,
                duration,
                ease: 'power2.out',
                onUpdate: () => {
                  setDisplayValue(obj.val);
                },
              });
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  const formatNumber = (num: number) => {
    if (value >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(decimals || 1);
    }
    if (value >= 1_000_000) {
      return (num / 1_000_000).toFixed(decimals || 0);
    }
    if (value >= 1000) {
      return Math.round(num).toLocaleString();
    }
    return Math.round(num).toString();
  };

  const showPlaceholder = !hasAnimated.current && displayValue === 0;

  return (
    <span ref={ref} className={`font-data ${className}`}>
      {showPlaceholder
        ? '\u2014'
        : <>{prefix}{formatNumber(displayValue)}{suffix}</>
      }
    </span>
  );
}
