const API_BASE =
  import.meta.env.VITE_API_BASE || "https://task.moraspirit.com";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error instanceof TypeError) {
      throw new Error(
        "Network error. Please check your internet connection or the API availability."
      );
    }
    throw error;
  }
}

export function getMembers(signal) {
  return request("/api/members", { method: "GET", signal });
}

export function checkAvailability(payload, signal) {
  return request("/api/availability/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
}
