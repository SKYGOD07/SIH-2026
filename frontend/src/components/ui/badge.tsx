import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-navy-900 text-white shadow-sm',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700',
        gov:
          'border-govblue-200 bg-govblue-50 text-govblue-700 font-medium',
        verified:
          'border-emerald-200 bg-emerald-50 text-emerald-800 font-medium',
        pending:
          'border-amber-200 bg-amber-50 text-amber-800 font-medium',
        destructive:
          'border-red-200 bg-red-50 text-red-800 font-medium',
        outline:
          'border border-slate-200 text-slate-700 bg-white',
        saffron:
          'border-amber-300 bg-amber-50 text-amber-900 font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
