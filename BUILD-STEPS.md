# Member Availability Dashboard — Master Build Guide

> The ONLY file you need. Follow it top to bottom in an empty folder and you
> will end up with the exact project in this repo. No other source required.
>
> Stack: React 19 + Vite 8 + JavaScript + Tailwind CSS v4 + shadcn/ui-style
> components (hand-copied source, no shadcn CLI needed).
>
> Live API: `https://task.moraspirit.com`

---

## 0. What you are building (task requirements)

A frontend dashboard that:

1. Fetches all organization members (`GET /api/members`) and shows them in a
   responsive grid of cards.
2. Lets the user select one member + one date.
3. Runs a real-time availability check (`POST /api/availability/check`).
4. Shows a **green** indicator when available, a **red** indicator + `reason`
   when busy.
5. Handles loading, error, and empty states; works with keyboard only; is
   deployed online with source on GitHub.

Final project structure (16 source files):

```txt
sample-dashboard/
  package.json
  vite.config.js
  index.html
  src/
    main.jsx
    index.css
    App.jsx
    lib/
      utils.js
    api/
      client.js
    hooks/
      useMembers.js
      useAvailabilityCheck.js
    components/
      MemberCard.jsx
      MemberGrid.jsx
      ErrorMessage.jsx
      StatusResult.jsx
      ui/
        button.jsx
        card.jsx
        badge.jsx
        input.jsx
        label.jsx
        alert.jsx
        skeleton.jsx
```

Build order in this guide follows dependencies: scaffold → theme →
`lib/utils` → `ui/*` → `api` → `hooks` → feature components → `App`.

---

## 1. Prerequisites

- Node.js 20+ and npm 10+:
  ```powershell
  node --version
  npm --version
  ```
- JavaScript: promises, `async/await`, `try/catch`, JSON, modules.
- React: components, props, `useState`, `useEffect`, `useRef`, `useCallback`.
- No global tools needed. Everything installs locally via `npm install`.

---

## 2. API reference (read before writing any UI code)

Base URL: `https://task.moraspirit.com`

### Endpoint 1 — Get member list

```http
GET /api/members
```

Response:

```json
{
  "count": 14,
  "members": [
    { "id": "MSP000", "name": "Sangeeth Kariyapperuma", "role": "Web and Technology Pillar Head" },
    { "id": "MSP001", "name": "Thisuka Kodithuwakku", "role": "CMO" }
  ]
}
```

> Note: the task PDF says `count: 27`, the live API returns `count: 14`.
> Never hard-code the count — always render `data.members ?? []`.

### Endpoint 2 — Check availability

```http
POST /api/availability/check
Content-Type: application/json

{ "msp_id": "MSP001", "date": "2026-04-08" }
```

Busy response:

```json
{
  "requested_date": "2026-04-08",
  "id": "MSP001",
  "name": "Thisuka Kodithuwakku",
  "role": "CMO",
  "status": "busy",
  "reason": "Unavailable because the CMO is leading a strategy workshop."
}
```

`status` is `"available"` or `"busy"` (compare case-insensitively).
`reason` is shown when busy.

Verify the API is alive before coding (PowerShell):

```powershell
Invoke-RestMethod -Uri 'https://task.moraspirit.com/api/members' |
  Select-Object -Property count

$body = ConvertTo-Json @{ msp_id = 'MSP001'; date = '2026-04-08' }
Invoke-RestMethod -Uri 'https://task.moraspirit.com/api/availability/check' `
  -Method Post -Body $body -ContentType 'application/json' |
  ConvertTo-Json -Depth 5
```

---

## 3. Scaffold the project

Create an empty folder and run:

```powershell
mkdir sample-dashboard
cd sample-dashboard
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge class-variance-authority lucide-react
```

What each package is for:

| Package | Why |
|---|---|
| `react`, `react-dom` | UI framework |
| `vite`, `@vitejs/plugin-react` | Dev server + production bundler |
| `tailwindcss`, `@tailwindcss/vite` | Utility CSS (v4, no config file needed) |
| `clsx`, `tailwind-merge` | `cn()` class merger used by every ui component |
| `class-variance-authority` | `cva()` variant system for Button/Badge/Alert |
| `lucide-react` | Icons (Search, Loader2, XCircle, …) |

### 3.1 `package.json`

Must contain `"type": "module"` exactly once (Vite loads config as ESM).
A duplicate `"type": "commonjs"` key breaks the Tailwind plugin.

```json
{
  "name": "sample-dashboard",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "license": "ISC",
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.47.0",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "tailwind-merge": "^3.7.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "tailwindcss": "^4.3.3",
    "vite": "^8.3.0"
  }
}
```

### 3.2 `vite.config.js`

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 3.3 `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Member Availability Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 3.4 `src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 3.5 `src/index.css`

Tailwind v4 entry. The single `@import` generates all utilities on demand.
Only `/* … */` comments are allowed here — `//` comments break the build.

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f5f7fb;
  color: #1f2937;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}
```

---

## 4. `src/lib/utils.js` — the `cn()` helper

Every ui component imports this. `clsx` joins class names (ignores
false/null); `tailwind-merge` resolves conflicts (`"px-2 px-4"` → `"px-4"`).

```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## 5. `src/components/ui/button.jsx`

Variants used by this app: `default` (submit), `destructive` + `sm` (retry).
`outline`/`secondary` are kept as standard shadcn options.

```jsx
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
```

Usage: `<Button variant="default">Check availability</Button>`,
`<Button variant="destructive" size="sm">Retry</Button>`.

---

## 6. `src/components/ui/card.jsx`

```jsx
import * as React from "react";
import { cn } from "../../lib/utils.js";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold tracking-tight text-base", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

---

## 7. `src/components/ui/badge.jsx`

`success` (emerald) is a project addition for the "Available" state.

```jsx
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
```

---

## 8. `src/components/ui/input.jsx`

```jsx
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
```

---

## 9. `src/components/ui/label.jsx`

Always pair with an input via `htmlFor` + matching `id`.

```jsx
import * as React from "react";
import { cn } from "../../lib/utils.js";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-slate-900 " +
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
```

---

## 10. `src/components/ui/alert.jsx`

Only `default` and `destructive` are used by this app.

```jsx
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950",
  {
    variants: {
      variant: {
        default: "bg-white text-slate-950 border-slate-200",
        destructive:
          "border-red-400/60 bg-red-50 text-red-900 [&>svg]:text-red-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
```

---

## 11. `src/components/ui/skeleton.jsx`

Pulsing placeholder shown while loading. Reserves layout space so content
does not jump when data arrives.

```jsx
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
```

---

## 12. `src/api/client.js` — all backend communication

UI components never call `fetch` directly. Key facts: `fetch` only rejects
on network failure (HTTP 404/500 still resolve, so check `response.ok`);
JSON POSTs need `Content-Type` + `JSON.stringify`; `signal` enables cancel.

```js
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
```

---

## 13. `src/hooks/useMembers.js` — load list once on mount

```js
import { useCallback, useEffect, useState } from "react";
import { getMembers } from "../api/client";

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers(signal);
      setMembers(data?.members ?? []);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return { members, loading, error, refetch };
}
```

---

## 14. `src/hooks/useAvailabilityCheck.js` — check on button click

Aborts the previous request first so rapid clicks cannot show stale data.
`reset()` runs on every input change to clear the previous result.

```js
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
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await checkAvailability({ msp_id, date }, controller.signal);
      if (!controller.signal.aborted) setResult(data);
    } catch (err) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  return { result, loading, error, check, reset };
}
```

---

## 15. Feature components (render only, no fetching)

### 15.1 `src/components/MemberCard.jsx`

Interactive card = `<button>` (free keyboard support + focus ring).
`aria-pressed` announces selected state to screen readers.

```jsx
import { Card, CardContent } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { cn } from "../lib/utils.js";

export function MemberCard({ member, isSelected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(member.id)}
      className={cn(
        "rounded-xl text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
        isSelected && "ring-2 ring-slate-900 ring-offset-2"
      )}
    >
      <Card
        className={cn(
          "h-full transition-colors hover:border-slate-400",
          isSelected ? "border-slate-900" : "border-slate-200"
        )}
      >
        <CardContent className="flex flex-col gap-2 p-4">
          <Badge variant="secondary" className="w-fit">
            {member.role}
          </Badge>
          <strong className="text-base text-slate-900">{member.name}</strong>
          <span className="text-xs text-slate-500">{member.id}</span>
        </CardContent>
      </Card>
    </button>
  );
}
```

### 15.2 `src/components/MemberGrid.jsx`

`key={member.id}` uses the stable backend ID, never the array index.

```jsx
import { MemberCard } from "./MemberCard";

export function MemberGrid({ members, selectedMemberId, onSelect }) {
  if (!members.length) {
    return <p className="text-slate-500">No members found.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isSelected={member.id === selectedMemberId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
```

### 15.3 `src/components/ErrorMessage.jsx`

Member-list failure with Retry wired to `useMembers().refetch`.

```jsx
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
```

### 15.4 `src/components/StatusResult.jsx`

Owns all check states in priority order: loading → error → idle → data.
`status?.toLowerCase()` tolerates `"Available"`/`"AVAILABLE"`/future values.
Color AND text satisfy color-blind users; `role="status"` + `aria-live`
announce async results.

```jsx
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
```

---

## 16. `src/App.jsx` — wire everything together

State model: 2 hooks + 2 local states. `selectedMember` is derived via
`.find` (never duplicated in state). `canSubmit` gates the button.
`reset()` on every input change clears stale results.

```jsx
import { useState } from "react";
import { Search } from "lucide-react";
import { useMembers } from "./hooks/useMembers";
import { useAvailabilityCheck } from "./hooks/useAvailabilityCheck";
import { MemberGrid } from "./components/MemberGrid";
import { StatusResult } from "./components/StatusResult";
import { ErrorMessage } from "./components/ErrorMessage";
import { Button } from "./components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Label } from "./components/ui/label.jsx";
import { Skeleton } from "./components/ui/skeleton.jsx";

export default function App() {
  const { members, loading, error, refetch } = useMembers();
  const {
    result,
    loading: checking,
    error: checkError,
    check,
    reset,
  } = useAvailabilityCheck();

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [date, setDate] = useState("");

  const selectedMember = members.find(
    (member) => member.id === selectedMemberId
  );
  const canSubmit = Boolean(selectedMemberId && date && !checking);

  function handleMemberSelect(id) {
    setSelectedMemberId(id);
    reset();
  }

  function handleDateChange(event) {
    setDate(event.target.value);
    reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    await check(selectedMemberId, date);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Member Availability Dashboard
        </h1>
        <p className="mt-1 text-slate-600">
          Select a member and date to check availability.
        </p>
      </header>

      <section aria-label="Members">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Members</h2>

        {loading && (
          <div
            role="status"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        )}

        {error && !loading && (
          <ErrorMessage message={error} onRetry={refetch} />
        )}

        {!loading && !error && (
          <MemberGrid
            members={members}
            selectedMemberId={selectedMemberId}
            onSelect={handleMemberSelect}
          />
        )}
      </section>

      <section aria-label="Availability check" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Check Availability</CardTitle>
            <CardDescription>
              Pick a member from the grid, choose a date, then run the
              real-time check against the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 md:flex-row md:items-end"
            >
              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="member-summary">Selected Member</Label>
                <Input
                  id="member-summary"
                  type="text"
                  disabled
                  value={
                    selectedMember
                      ? `${selectedMember.name} (${selectedMember.id})`
                      : "No member selected"
                  }
                />
              </div>

              <div className="grid flex-1 gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  required
                />
              </div>

              <Button type="submit" disabled={!canSubmit} className="md:w-auto">
                {checking ? (
                  "Checking..."
                ) : (
                  <>
                    <Search aria-hidden="true" />
                    Check availability
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <StatusResult
                result={result}
                loading={checking}
                error={checkError}
                fallbackDate={date}
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
```

---

## 17. Run, build, verify

```powershell
npm run dev      # http://localhost:5173
npm run build    # must pass with no errors, outputs dist/
npm run preview  # serves dist/ locally to double-check production
```

Manual test checklist (do all before calling it done):

| # | Case | Expected |
|---|---|---|
| 1 | Load page | Skeleton cards → member grid (14 cards) |
| 2 | Break `API_BASE` temporarily | Red error banner + working Retry button |
| 3 | API returns `members: []` | "No members found." |
| 4 | No member selected | Submit button disabled |
| 5 | No date selected | Submit button disabled |
| 6 | Valid available check | Green dot + `Available` badge + details |
| 7 | Valid busy check | Red dot + `Busy` badge + API `reason` |
| 8 | Bad member ID | Friendly error message from API JSON |
| 9 | Double-click submit fast | Single latest result, no flicker |
| 10 | Keyboard only (Tab/Enter) | All cards + form operable, focus visible |

---

## 18. Deployment

Push to GitHub, then host:

```powershell
git init
git add .
git commit -m "Add member availability dashboard"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

- **Vercel:** import repo → Framework `Vite` → Build `npm run build` → Output `dist`.
- **Netlify:** Build `npm run build` → Publish `dist`.
- **GitHub Pages:** `npm run build`, publish `dist/` (needs a SPA/static setup).
- Optional env override: `VITE_API_BASE=https://task.moraspirit.com`.

---

## 19. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `default is not a function` from Tailwind plugin | Duplicate `"type"` keys in `package.json` (last key wins, config loads as CJS) | Keep only `"type": "module"` |
| `CssSyntaxError: Unterminated string` in `index.css` | `//` comments in CSS (only `/* */` is valid) | Use `/* */` comments |
| `Failed to fetch` TypeError | Offline, DNS, CORS, or server down | App converts this to the "Network error…" message |
| Stale result after fast double-click | First (slow) response resolves last | `useAvailabilityCheck` aborts previous request |
| Old result visible after picking another member | Previous output not cleared | `reset()` runs on every input change |
| Build output missing | `dist/` is gitignored by design | Run `npm run build` to regenerate |

---

## 20. Interview answers (30 seconds each)

- **Architecture:** "API layer for requests, hooks for loading/error/data,
  components render-only, App wires state."
- **State:** "Local state — list, selection, date, result. No Redux; React
  Query only if caching/retries were needed."
- **API:** "GET `/api/members`, POST `/api/availability/check` with
  `{msp_id, date}`. I check `response.ok` because fetch doesn't throw on
  HTTP errors."
- **Errors:** "HTTP errors, network TypeErrors, empty list, missing inputs,
  stale races via AbortController, retry for the list."
- **Responsive:** "Tailwind grid `sm/lg/xl`; form stacks on mobile, rows on
  desktop."
- **Accessibility:** "Native buttons/labels, `aria-pressed`, `role=alert`,
  `role=status` + `aria-live`, focus-visible rings, text plus color."
- **Next improvements:** "Search filter, TypeScript types, Vitest tests,
  React Query migration."
