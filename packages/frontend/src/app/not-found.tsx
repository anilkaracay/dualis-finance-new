import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#0A0E17',
        color: '#F9FAFB',
      }}
    >
      <div style={{ fontSize: '6rem', fontWeight: 700, color: '#00D4AA', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>
        Page Not Found
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '2rem', maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#00D4AA',
            color: '#0A0E17',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go Home
        </Link>
        <Link
          href="/overview"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#00D4AA',
            border: '1px solid #00D4AA',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
