function TBillIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="2" y="4" width="28" height="24" rx="4" fill="#4C7BF4"/>
      <rect x="7" y="10" width="14" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
      <rect x="7" y="14" width="18" height="1.5" rx="0.75" fill="white" opacity="0.5"/>
      <rect x="7" y="18" width="10" height="1.5" rx="0.75" fill="white" opacity="0.3"/>
      <text x="25" y="23" textAnchor="end" fill="white" fontSize="6" fontWeight="600" fontFamily="Inter,sans-serif" opacity="0.8">T</text>
    </svg>
  );
}
export { TBillIcon };
