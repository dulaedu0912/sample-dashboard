import { cn } from "../../lib/utils.js";

function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}

export { Skeleton };
