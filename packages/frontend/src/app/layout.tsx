import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('dualis-ui')||'{}');var p=s.state&&s.state.themePreference||'dark';var t=p;if(p==='system'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakarta.variable} font-sans bg-bg-primary text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
