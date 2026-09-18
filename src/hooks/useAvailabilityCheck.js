import { useCallback, useRef, useState } from "react";
import { checkAvailability } from "../api/client";

export function useAvailabilityCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const check = useCallback(async (msp_id, date) => {
    // Cancel any in-flight check so fast repeated clicks can't show stale data
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await checkAvailability({ msp_id, date }, controller.signal);
      if (!controller.signal.aborted) {
        setResult(data);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  return { result, loading, error, check, reset };
}
