import { AlertCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx";
import { Button } from "./ui/button.jsx";

export function ErrorMessage({ message, onRetry }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Failed to load members</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
