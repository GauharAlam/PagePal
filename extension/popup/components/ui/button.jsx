import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground border border-border',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

const sizes = { default: 'h-8 px-3 text-xs font-semibold', sm: 'h-7 px-2.5 text-xs font-medium', lg: 'h-9 px-4 text-sm font-semibold', icon: 'h-8 w-8' };

export function Button({ className, variant = 'default', size = 'default', disabled, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
