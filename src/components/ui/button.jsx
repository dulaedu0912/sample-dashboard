import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors " +
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600 " +
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline:
          "border border-slate-300 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
        secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
