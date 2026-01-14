import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-red text-white hover:bg-primary-red-hover shadow-lg shadow-primary-red/20 hover:shadow-xl hover:shadow-primary-red/30 focus-visible:ring-primary-red",
        secondary:
          "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/20 focus-visible:ring-neutral-900",
        outline:
          "border-2 border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:ring-neutral-400",
        ghost:
          "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        gold:
          "bg-accent-gold text-neutral-900 hover:bg-accent-gold-hover shadow-lg shadow-accent-gold/20 focus-visible:ring-accent-gold",
        teal:
          "bg-accent-teal text-white hover:bg-accent-teal-hover shadow-lg shadow-accent-teal/20 focus-visible:ring-accent-teal",
        link:
          "text-primary-red underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 text-base",
        sm: "h-9 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

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
Button.displayName = "Button";

export { Button, buttonVariants };
