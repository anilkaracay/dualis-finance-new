function CantonIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 2L28.66 9.5v13L16 30 3.34 22.5v-13L16 2z" fill="#00E6B8"/>
      <path d="M16 8a8 8 0 100 16 8 8 0 000-16zm0 13.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" fill="white" opacity="0.9"/>
      <text x="16" y="17.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Inter,sans-serif" dominantBaseline="middle">C</text>
    </svg>
  );
}
export { CantonIcon };
