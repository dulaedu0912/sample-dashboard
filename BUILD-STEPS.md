# Member Availability Dashboard — Step-by-Step Build Guide

> Stack: React 19 + Vite 8 + JavaScript + Tailwind CSS v4
> API: `https://task.moraspirit.com`
> Goal: learning + portfolio project covering Component Architecture, State Management, API Integration, Loading/Error Handling, UI/UX, Accessibility, Deployment, Interview Explanation.

Final structure in this folder:

```txt
sample-dashboard/
  index.html
  vite.config.js
  package.json
  src/
    api/client.js
    hooks/useMembers.js
    hooks/useAvailabilityCheck.js
    components/MemberCard.jsx
    components/MemberGrid.jsx
    components/ErrorMessage.jsx
    components/StatusResult.jsx
    App.jsx
    main.jsx
    index.css
```

---

## Prerequisites

- Node.js 20+ (`node --version`), npm 10+
- Basic JS: promises, `async/await`, `try/catch`, JSON
- Basic React: components, props, `useState`, `useEffect`
- This API is live — test it first before writing UI code.

Verify API manually (PowerShell):

```powershell
Invoke-RestMethod -Uri 'https://task.moraspirit.com/api/members' | ConvertTo-Json -Depth 5
# -> { count: 14, members: [{ id, name, role }] }

$body = ConvertTo-Json @{ msp_id='MSP001'; date='2026-04-08' }
Invoke-RestMethod -Uri 'https://task.moraspirit.com/api/availability/check' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 5
# -> { requested_date, id, name, role, status: "available"|"busy", reason }
```

**Logic:** always confirm the real response shape before coding. The PDF says `count: 27`, the live API returns `count: 14`. Code against reality: `data.members ?? []`, `result.status?.toLowerCase()`.

---

## Step 0 — Scaffold the project in the current folder

We built directly in `sample-dashboard/` (which already contained the PDF), so we did a manual scaffold instead of `npm create vite` (which prompts on non-empty folders).

```powershell
npm init -y
npm install react react-dom
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

**1. `package.json`** — must be ESM for Vite:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

> Gotcha we hit: duplicate `"type": "module"` + `"type": "commonjs"`. Last key wins in JSON, so Vite loaded config as CJS and Tailwind's plugin failed with `default is not a function`. Fix = keep only `"type": "module"`.

**2. `vite.config.js`** — React + Tailwind v4 (no `tailwind.config.js` needed in v4):

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**3. `index.html`:**

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

**4. `src/main.jsx`:**

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

**5. `src/index.css`** — Tailwind v4 entry:

```css
@import "tailwindcss";

body {
  margin: 0;
  background: #f5f7fb;
  color: #1f2937;
  font-family: Inter, system-ui, sans-serif;
}
```

**When to use what:**
- Use `npm init` + manual installs when the folder is not empty or you want full control.
- Use `npm create vite@latest` only for empty folders.
- Use `@tailwindcss/vite` (v4 style) for new projects. Use `tailwind.config.js` + PostCSS only if you are stuck on Tailwind v3.

---

## Step 1 — Central API client (`src/api/client.js`)

All backend communication lives in one file. UI components never call `fetch` directly.

```js
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://task.moraspirit.com";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.message || data?.error || `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error instanceof TypeError) {
      throw new Error("Network error. Please check your internet connection or the API availability.");
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

**Logic, line by line:**

1. `API_BASE` from env with fallback → **when to use:** always. Lets you switch dev/prod without editing code (`VITE_API_BASE` in `.env`).
2. `await fetch(...)` → returns a `Response` even for 404/500. It only rejects on network failure.
3. `await response.json().catch(() => null)` → **when to use:** APIs sometimes return empty bodies. Without `.catch`, a 204/empty body crashes your app.
4. `if (!response.ok) throw` → **the most important fetch lesson.** `fetch` does NOT throw for HTTP errors. You must check `ok` yourself. Error body here is `{"error","message"}`, so read `data.message || data.error`.
5. `error instanceof TypeError` → **when to use:** this is how `fetch` signals DNS failure, offline, CORS block. Convert to a human message.
6. `signal` passthrough → **when to use:** every request that can become stale (user clicks fast, component unmounts). Lets callers cancel via `AbortController`.
7. `POST` needs `Content-Type: application/json` + `JSON.stringify({ msp_id, date })` → **when to use:** any JSON POST. Without the header the backend may reject with 415/400.

---

## Step 2 — Fetch members hook (`src/hooks/useMembers.js`)

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
    return () => controller.abort(); // cleanup on unmount
  }, [load]);

  const refetch = useCallback(() => load(), [load]);
  return { members, loading, error, refetch };
}
```

**Logic — when to use each hook:**

| Hook | Used here for | Rule of thumb |
|---|---|---|
| `useState` | `members`, `loading`, `error` — data that changes what renders | Use for anything the UI displays |
| `useEffect` | Fire `load()` once on mount, abort on unmount | Use for side effects: fetch, subscribe, timers. Never fetch directly in render body |
| `useCallback` | Memoize `load`/`refetch` so `useEffect` deps don't loop | Use when a function is a `useEffect` dep or passed to memoized children |
| `AbortController` | Cancel fetch if component unmounts | Use for every fetch in `useEffect` — prevents "setState on unmounted component" warnings |

**States you must handle:** `loading` → `error` → `empty (members.length===0)` → `data`. Interviewers explicitly look for this quartet.

---

## Step 3 — Availability check hook (`src/hooks/useAvailabilityCheck.js`)

Different from Step 2: this is user-triggered (button click), not mount-triggered, and rapid clicks can race.

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
    controllerRef.current?.abort(); // cancel previous check
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await checkAvailability({ msp_id, date }, controller.signal);
      if (!controller.signal.aborted) setResult(data);
    } catch (err) {
      if (err.name !== "AbortError" && !controller.signal.aborted) setError(err.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  return { result, loading, error, check, reset };
}
```

**Logic:**

1. `useRef` holds the in-flight controller across renders **without re-rendering**. **When to use `useRef` vs `useState`:** need a mutable box that survives renders but shouldn't trigger a render → `useRef`. Need UI to update → `useState`.
2. `check()` aborts the previous request first → fixes the race where a slow first click resolves after a fast second click and shows stale data.
3. `reset()` is called when member/date changes → old result must disappear immediately, otherwise the user sees "Available for MSP001" while MSP002 is selected. **When to use:** any dependent form — changing an input invalidates the previous output.
4. Guard every `setState` with `!signal.aborted` → aborted fetches must not touch state.

---

## Step 4 — UI components (render only, no fetching)

### 4a. `MemberCard.jsx` — a button, not a div

```jsx
export function MemberCard({ member, isSelected, onSelect }) {
  return (
    <button type="button" aria-pressed={isSelected} onClick={() => onSelect(member.id)}
      className={isSelected ? "border-blue-600 ..." : "border-slate-300 ..."}>
      <span>{member.role}</span>
      <strong>{member.name}</strong>
      <span>{member.id}</span>
    </button>
  );
}
```

**Logic:** interactive card = `<button>`. Free keyboard support (Tab/Enter/Space), free focus ring, screen readers announce it. `aria-pressed` tells assistive tech "selected / not selected". **When to use button vs div:** clickable → button. Never put `onClick` on a div for a core action.

### 4b. `MemberGrid.jsx` — list + keys + empty state

```jsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {members.map((m) => <MemberCard key={m.id} member={m} ... />)}
</div>
```

**Logic:** `key={member.id}` (stable ID, not array index) lets React reconcile efficiently. Early return `No members found.` covers the empty API case. Grid classes give responsiveness with zero media queries.

### 4c. `ErrorMessage.jsx` — fail loudly with recovery

```jsx
<div role="alert">
  <p>{message}</p>
  {onRetry && <button onClick={onRetry}>Retry</button>}
</div>
```

**Logic:** `role="alert"` announces immediately to screen readers. Always pair an error with an action (Retry) when recovery is possible. **When to use:** member-list failures (retryable). Availability failures are shown inline in `StatusResult` instead (contextual).

### 4d. `StatusResult.jsx` — one component, all outcome states

Order matters:

```jsx
if (loading) return <p role="status">Checking availability...</p>;
if (error)   return <div role="alert">Could not check availability. {error}</div>;
if (!result) return <p>Select a member and date...</p>;
// then available / busy / unknown
const status = result.status?.toLowerCase();
```

**Logic:**
- Check `loading` first, then `error`, then `!result`, then data. This priority prevents flashing stale data during a new check.
- `status?.toLowerCase()` — defensive: backend could send `"Available"`, `"AVAILABLE"`, or a new value. Unknown values fall through to a neutral style instead of crashing.
- Color AND text (`Available`/`Busy` + reason). **When to use:** always — color alone fails color-blind users and fails the accessibility criterion.
- `aria-live="polite"` + `role="status"` — screen readers announce async results. **When to use:** any region updated by a network request.

---

## Step 5 — Wire everything in `App.jsx`

```jsx
const { members, loading, error, refetch } = useMembers();
const { result, loading: checking, error: checkError, check, reset } = useAvailabilityCheck();
const [selectedMemberId, setSelectedMemberId] = useState("");
const [date, setDate] = useState("");

const selectedMember = members.find((m) => m.id === selectedMemberId);
const canSubmit = Boolean(selectedMemberId && date && !checking);

function handleMemberSelect(id) { setSelectedMemberId(id); reset(); }
function handleDateChange(e)    { setDate(e.target.value); reset(); }

async function handleSubmit(e) {
  e.preventDefault();
  if (!canSubmit) return;
  await check(selectedMemberId, date);
}
```

**Logic:**

1. Two custom hooks + two local states = entire state model. **When to use local state vs Redux:** one screen, no cross-page sharing → local state + hooks. Mention in interview: "Redux/Zustand only if global client state grows; React Query/SWR only if I need caching/retries/background refetch."
2. `selectedMember` is **derived**, not stored — computed via `.find` each render. **When to derive vs store:** if it can be computed from existing state, don't duplicate it in state (avoids desync bugs).
3. `canSubmit` gates the button: needs member AND date AND not already checking. Prevents 400s from empty payloads and duplicate POSTs.
4. `reset()` on every input change — see Step 3.
5. `e.preventDefault()` on form submit — prevents full page reload. `required` on date input gives free browser validation.
6. Render sections mirror Step 2/4 states: `loading → error+Retry → MemberGrid`; form + `StatusResult`.

---

## Step 6 — Styling with Tailwind v4

- `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` → responsive cards, no custom CSS.
- `flex flex-wrap items-end gap-4` form → wraps on desktop, add `flex-col` behavior on mobile via wrapping (or `flex-col md:flex-row`).
- Selected: `border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.2)]`.
- Status: `bg-emerald-50/border-emerald-500` vs `bg-red-50/border-red-400` + dot `bg-emerald-500/bg-red-500`.
- Focus: `focus-visible:outline-3 focus-visible:outline-blue-600` on every interactive element. **When to use:** always — keyboard users need visible focus; `:focus-visible` shows it only for keyboard, not mouse.
- Disabled: `disabled:opacity-60 disabled:cursor-not-allowed` + disabled selected-member summary field (`bg-slate-100`).

---

## Step 7 — Run, build, verify

```powershell
npm run dev    # http://localhost:5173
npm run build  # outputs dist/, must pass with no errors
npm run preview
```

Manual test checklist (do all before calling it done):

| # | Case | Expected |
|---|---|---|
| 1 | Load | 14 cards in responsive grid |
| 2 | Break `API_BASE` temporarily | Red error + Retry button |
| 3 | Empty `members: []` (mock) | "No members found." |
| 4 | No member selected | Button disabled |
| 5 | No date selected | Button disabled |
| 6 | Valid check | Green `Available` + name/role/date/reason |
| 7 | Busy (if API returns it) | Red `Busy` + reason |
| 8 | Bad ID (`BAD`) | Friendly `No member found...` (from 404 JSON) |
| 9 | Double-click fast | Single latest result, no flicker (AbortController) |
| 10 | Keyboard only (Tab/Enter) | All cards + form operable, focus visible |

---

## Step 8 — Deployment (when ready)

```powershell
git init
git add .
git commit -m "Add member availability dashboard"
# create GitHub repo, then:
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

- Vercel: import repo → Framework `Vite` → Build `npm run build` → Output `dist`.
- Netlify: Build `npm run build` → Publish `dist`.
- Env var if needed: `VITE_API_BASE=https://task.moraspirit.com`.

---

## Appendix A — "When do I use this?" cheat sheet

- `fetch` + `response.ok` check → every REST call. `fetch` only throws on network failure.
- `GET` → read data. `POST` + `Content-Type: application/json` + `JSON.stringify` → send data.
- `useState` → UI-visible data. `useRef` → mutable instance value (controller, timer id) that must not re-render.
- `useEffect` → mount/update/unmount side effects (initial fetch). Event handlers (`onClick`, `onSubmit`) → user-triggered fetches, no `useEffect` needed.
- `useCallback` → stabilize functions used as effect deps or passed deep. Don't wrap everything prematurely.
- `AbortController` → any fetch tied to a component lifecycle or superseded by newer input.
- Custom hook (`useMembers`, `useAvailabilityCheck`) → when fetch + loading + error logic is reused or clutters the component. Keeps components presentational.
- Central `api/` layer → when >1 component talks to the backend or the base URL/headers/auth could change.
- `<button>` + `aria-pressed` → selectable cards. `role=alert` → errors. `role=status` + `aria-live` → async success output. Color + text → status indicators.
- Redux/Zustand → global client state across many routes. React Query/SWR → server-state caching/retries. Neither needed for this single-page MVP — and saying why scores points.

## Appendix B — Interview answers (30 seconds each)

- **Architecture:** "API layer for requests, hooks for loading/error/data, components for rendering only."
- **State:** "Local state — member list, selection, date, result. Redux would be overkill; I'd reach for React Query if caching mattered."
- **API:** "GET `/api/members`, POST `/api/availability/check` with `{msp_id, date}`. I check `response.ok` because fetch doesn't throw on HTTP errors."
- **Errors:** "HTTP errors, network TypeErrors, empty list, missing inputs, stale races via AbortController, retry for the list."
- **Responsive:** "Tailwind grid `sm/lg/xl` breakpoints; form wraps and stacks."
- **A11y:** "Native buttons, labels, focus-visible, aria-pressed, live regions, text plus color."
- **Improve next:** "TypeScript types, search filter, skeletons, Vitest + Testing Library, React Query."

## Appendix C — Suggested next upgrades (in order)

1. Search filter (name/role/id) — practices derived state.
2. TypeScript (`Member`, `AvailabilityResponse` interfaces).
3. Skeleton cards instead of "Loading...".
4. Date validation (no empty/past dates if business rules require).
5. Tests: loading render, empty list, disabled button, busy reason, API failure.
6. React Query migration — after mastering the manual version above.
