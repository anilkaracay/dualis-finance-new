function DualIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="dual-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00E6B8"/>
          <stop offset="100%" stopColor="#7C6FF7"/>
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#dual-grad)"/>
      <text x="16" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif" dominantBaseline="middle">D</text>
    </svg>
  );
}
export { DualIcon };
