export function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-400 bg-red-50 p-4 text-red-900"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 cursor-pointer rounded-lg bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-600 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
