import '@/styles/landing.css';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Instrument Serif — loaded via Google Fonts link for display headlines */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <div className="landing-page">{children}</div>
    </>
  );
}
