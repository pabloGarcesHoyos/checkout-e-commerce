import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: ReactNode;
}

export const Button = ({
  variant = 'primary',
  isLoading = false,
  loadingText = 'Loading…',
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    aria-busy={isLoading}
    className={`rounded-lg px-4 py-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
    {...rest}
  >
    {isLoading ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {loadingText}
      </span>
    ) : (
      children
    )}
  </button>
);
