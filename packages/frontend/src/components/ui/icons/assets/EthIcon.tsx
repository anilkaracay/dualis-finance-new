function EthIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 4l-.2.5v15.7l.2.1 7.2-4.3L16 4z" fill="white" opacity="0.6"/>
      <path d="M16 4l-7.2 12 7.2 4.3V4z" fill="white"/>
      <path d="M16 21.7l-.1.1v5.5l.1.3 7.2-10.2L16 21.7z" fill="white" opacity="0.6"/>
      <path d="M16 27.6v-5.9l-7.2-4.3L16 27.6z" fill="white"/>
      <path d="M16 20.3l7.2-4.3L16 12.4v7.9z" fill="white" opacity="0.2"/>
      <path d="M8.8 16l7.2 4.3v-7.9L8.8 16z" fill="white" opacity="0.5"/>
    </svg>
  );
}
export { EthIcon };
