export function StatusResult({ result, loading, error, fallbackDate }) {
  if (loading) {
    return (
      <p
        role="status"
        className="rounded-xl border border-slate-300 bg-white p-4 text-slate-700"
      >
        Checking availability...
      </p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900"
      >
        <p className="font-semibold">Could not check availability.</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <p className="rounded-xl border border-slate-300 bg-white p-4 text-slate-700">
        Select a member and date, then check availability.
      </p>
    );
  }

  const status = result.status?.toLowerCase();
  const isAvailable = status === "available";
  const isBusy = status === "busy";

  const containerClass = isAvailable
    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
    : isBusy
      ? "border-red-400 bg-red-50 text-red-900"
      : "border-slate-400 bg-slate-50 text-slate-800";

  const dotClass = isAvailable
    ? "bg-emerald-500"
    : isBusy
      ? "bg-red-500"
      : "bg-slate-400";

  const statusLabel = isAvailable
    ? "Available"
    : isBusy
      ? "Busy"
      : result.status || "Unknown";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex gap-3 rounded-xl border p-4 ${containerClass}`}
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${dotClass}`}
      />
      <div>
        <p className="my-1">
          <strong>{result.name}</strong> · {result.role}
        </p>
        <p className="my-1">Date: {result.requested_date || fallbackDate}</p>
        <p className="my-1">Status: {statusLabel}</p>
        {result.reason && <p className="my-1 font-semibold">{result.reason}</p>}
      </div>
    </div>
  );
}
