import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';

const inter = localFont({
  src: '../../public/fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = localFont({
  src: '../../public/fonts/JetBrainsMono-Variable.woff2',
  variable: '--font-jetbrains',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Dualis Finance',
  description: 'Institutional lending protocol on Canton Network',
  openGraph: {
    title: 'Dualis Finance',
    description: 'Institutional lending protocol on Canton Network',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-bg-primary text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
