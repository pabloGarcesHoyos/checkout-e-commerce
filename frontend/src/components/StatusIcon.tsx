export type StatusIconVariant = 'success' | 'error' | 'pending';

const CIRCLE_CLASSES: Record<StatusIconVariant, string> = {
  success: 'bg-green-100 text-green-600',
  error: 'bg-red-100 text-red-600',
  pending: 'bg-gray-100 text-gray-500',
};

export const StatusIcon = ({ variant }: { variant: StatusIconVariant }) => (
  <div
    data-testid="status-icon"
    data-variant={variant}
    className={`flex h-16 w-16 items-center justify-center rounded-full ${CIRCLE_CLASSES[variant]}`}
  >
    {variant === 'pending' ? (
      <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : variant === 'success' ? (
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ) : (
      <svg
        className="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )}
  </div>
);
