import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal text-white hover:bg-teal-800 disabled:bg-teal-200 disabled:text-teal-900',
  accent: 'bg-marigold text-ink hover:brightness-95 disabled:bg-marigold-100',
  secondary: 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-50 disabled:text-ink-muted',
  ghost: 'bg-transparent text-teal-800 hover:bg-teal-50 disabled:text-ink-muted',
  danger: 'bg-coral-700 text-white hover:brightness-95 disabled:opacity-60',
};

const SIZES: Record<Size, string> = {
  md: 'h-12 px-5 text-md',
  sm: 'h-11 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-btn font-semibold transition-colors duration-fast ease-out disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors duration-fast hover:bg-mist',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
