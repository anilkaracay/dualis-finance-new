function SpyIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#00D68F"/>
      <path d="M8 22l4-6 3 3 4-8 5 11H8z" fill="white" opacity="0.3"/>
      <polyline points="8,22 12,16 15,19 19,11 24,22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export { SpyIcon };
