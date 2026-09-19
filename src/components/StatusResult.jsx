import { CalendarDays, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx";
import { Skeleton } from "./ui/skeleton.jsx";

export function StatusResult({ result, loading, error, fallbackDate }) {
  if (loading) {
    return (
      <div role="status" aria-live="polite" className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking availability...
        </div>
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Could not check availability.</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-slate-500">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Select a member and date, then check availability.
        </CardContent>
      </Card>
    );
  }

  const status = result.status?.toLowerCase();
  const isAvailable = status === "available";
  const isBusy = status === "busy";

  const badgeVariant = isAvailable
    ? "success"
    : isBusy
      ? "destructive"
      : "secondary";

  const statusLabel = isAvailable
    ? "Available"
    : isBusy
      ? "Busy"
      : result.status || "Unknown";

  const accentClass = isAvailable
    ? "border-l-4 border-l-emerald-500"
    : isBusy
      ? "border-l-4 border-l-red-500"
      : "border-l-4 border-l-slate-400";

  return (
    <Card role="status" aria-live="polite" className={accentClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">
          {result.name}{" "}
          <span className="font-normal text-slate-500">· {result.role}</span>
        </CardTitle>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={
              "h-3 w-3 rounded-full " +
              (isAvailable
                ? "bg-emerald-500"
                : isBusy
                  ? "bg-red-500"
                  : "bg-slate-400")
            }
          />
          <Badge variant={badgeVariant}>
            {isAvailable && (
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
            )}
            {statusLabel}
          </Badge>
        </span>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-slate-600">
          Date: {result.requested_date || fallbackDate}
        </p>
        {result.reason && (
          <p className={isBusy ? "font-medium text-red-900" : "text-slate-700"}>
            {result.reason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
