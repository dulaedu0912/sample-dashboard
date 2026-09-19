import * as React from "react";
import { cn } from "../../lib/utils.js";

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors",
        "placeholder:text-slate-400",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
