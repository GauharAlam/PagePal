import * as React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-input',
  success: 'bg-success text-white',
  warning: 'bg-warning text-black',
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-xs font-medium',
        // radius 0
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
