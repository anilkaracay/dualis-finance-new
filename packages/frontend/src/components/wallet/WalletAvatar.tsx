import { cn } from '@/lib/utils/cn';

interface WalletAvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function hashToColors(str: string): [string, string] {
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = str.charCodeAt(i) + ((hash1 << 5) - hash1);
    hash2 = str.charCodeAt(i) + ((hash2 << 7) - hash2);
  }
  const h1 = Math.abs(hash1) % 360;
  const h2 = Math.abs(hash2) % 360;
  return [`hsl(${h1}, 65%, 55%)`, `hsl(${h2}, 65%, 45%)`];
}

const sizePx: Record<string, number> = { sm: 24, md: 32, lg: 40 };

function WalletAvatar({ address, size = 'md', className }: WalletAvatarProps) {
  const px = sizePx[size] ?? 32;
  const [color1, color2] = hashToColors(address);

  return (
    <div
      className={cn('rounded-full shrink-0', className)}
      style={{
        width: px,
        height: px,
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
      }}
      role="img"
      aria-label="Wallet avatar"
    />
  );
}

export { WalletAvatar, type WalletAvatarProps };
