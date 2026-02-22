'use client';

interface SectionLabelProps {
  children: string;
  className?: string;
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <span className={`lp-section-label ${className}`}>
      {children}
    </span>
  );
}
