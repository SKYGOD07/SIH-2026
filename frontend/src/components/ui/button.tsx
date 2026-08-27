import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-govblue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-navy-900 text-white hover:bg-navy-800 shadow-sm border border-navy-900',
        primary:
          'bg-govblue-600 text-white hover:bg-govblue-700 shadow-sm border border-govblue-600',
        secondary:
          'bg-white text-navy-900 hover:bg-slate-50 border border-slate-200 shadow-sm',
        emerald:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-600',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
        ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600',
        link: 'text-govblue-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
