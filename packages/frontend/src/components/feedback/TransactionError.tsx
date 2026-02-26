'use client';

interface TransactionErrorProps {
  message: string;
  onRetry?: () => void;
}

export function TransactionError({ message, onRetry }: TransactionErrorProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
      <svg
        className="h-4 w-4 text-red-500 mt-0.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
