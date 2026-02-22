function WbtcIcon({ size = 32, className }: { size?: number | undefined; className?: string | undefined }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M21.8 13.8c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.2l-2.2-.6-.4 1.7s1.2.3 1.2.3c.6.2.8.6.7 1l-.7 2.8c0 .1.1.1.1.1l-.1 0-1 4c-.1.2-.3.6-.9.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.1.3l-.7 2.8 1.6.4.7-2.8c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1-.1-3.3-1.5-4 1.1-.3 1.9-1 2.1-2.5zm-3.7 5.2c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.2.3 5 .9 4.4 3.1zm.5-5.3c-.5 1.9-3.5.9-4.4.7l.9-3.4c1 .2 4.1.7 3.5 2.7z" fill="white"/>
    </svg>
  );
}
export { WbtcIcon };
