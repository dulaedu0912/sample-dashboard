import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " +
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
        secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        success: "border-transparent bg-emerald-100 text-emerald-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
