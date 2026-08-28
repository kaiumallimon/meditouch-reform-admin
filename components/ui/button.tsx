import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-4xl text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98]",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-muted active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-4xl px-3 text-xs",
        lg: "h-12 rounded-4xl px-8 text-base",
        icon: "size-9 rounded-4xl",
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
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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

