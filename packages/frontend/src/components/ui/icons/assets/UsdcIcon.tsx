interface IconProps { size?: number | undefined; className?: string | undefined }

function UsdcIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm0 18.5c-4.69 0-8.5-3.81-8.5-8.5S11.31 7.5 16 7.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5z" fill="white" opacity="0.3"/>
      <path d="M17.2 14.1c0-1.08-.66-1.45-1.98-1.6v-1.85h-1.1v1.8c-.3 0-.6.01-.9.02V10.65h-1.1v1.85c-.24.01-.48.02-.72.02H9.6v1.2h.85c.4 0 .52.15.56.41v3.48c-.02.19-.12.34-.42.34H9.6l-.15 1.35h1.75c.28 0 .56.01.84.02v1.88h1.1v-1.84c.32.01.63.01.94.01v1.83h1.1v-1.88c1.85-.11 3.15-.58 3.31-2.35.13-1.43-.54-2.07-1.6-2.33.65-.32 1.06-.88 1.06-1.72zm-1.53 3.78c0 1.4-2.4 1.24-3.17 1.24v-2.47c.77 0 3.17-.22 3.17 1.23zm-.54-3.58c0 1.27-2.0 1.12-2.63 1.12v-2.24c.63 0 2.63-.2 2.63 1.12z" fill="white"/>
    </svg>
  );
}
export { UsdcIcon };
