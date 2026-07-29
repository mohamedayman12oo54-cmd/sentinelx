# SentinelX Frontend

Dark, glowing "security command center" UI for the SentinelX AI Agent Monitoring Platform.

## Structure

```
src/
├── main.jsx                  # App entry
├── App.jsx                   # Router setup, AuthProvider, WelcomeIntro
├── index.css                 # Tailwind + global animations
│
├── layouts/
│   ├── AuthLayout.jsx          # Layout for /login, /signup, /forgot-password, /reset-password
│   └── AppLayout.jsx           # Sidebar + responsive shell for authenticated pages
│
├── components/ui/              # Reusable design-system pieces
│   ├── Logo.jsx                  # THE brand mark (shield + X) — used everywhere, never re-drawn ad hoc
│   ├── AmbientField.jsx          # Continuous drifting glow background
│   ├── GlassCard.jsx             # Glassmorphic card (rounded="2xl"|"3xl" prop)
│   ├── Sidebar.jsx                # Responsive nav drawer, reads from lib/routes.js
│   ├── Topbar.jsx / Breadcrumb.jsx
│   ├── StatCard.jsx               # Colored stat card with sparkline
│   ├── Badge.jsx / SaveButton.jsx / PageState.jsx (loader/error/empty)
│   ├── ProtectedRoute.jsx         # Redirects to /login if not authenticated
│   ├── PageTransition.jsx         # Signature "security scan" route transition
│   └── WelcomeIntro.jsx           # One-time cinematic splash (Landing route only)
│
├── hooks/
│   └── useOnScreen.js            # Scroll-reveal + count-up animation hooks
│
├── lib/
│   ├── routes.js                  # Single source of truth for nav items + breadcrumbs
│   ├── AuthContext.jsx            # Auth state (JWT + user), session persistence
│   ├── apiClient.js                # Fetch wrapper: base URL, JWT header, standardized errors
│   ├── mockDb.js                   # In-memory mock "database" (agents/observations/alerts/team)
│   └── api/                        # ONE MODULE PER RESOURCE — matches the official API docs exactly
│       ├── auth.js                   # POST /auth/login, /auth/logout, GET /auth/me, + signup/reset (extended)
│       ├── agents.js                 # Full Agents API (list/create/get/update/archive/rotate-key/observations)
│       ├── observations.js           # GET /observations, GET /observations/{id}
│       ├── alerts.js                 # GET /alerts, acknowledge/resolve
│       ├── dashboard.js              # GET /dashboard
│       └── team.js                   # Extended/proposed — not in the frozen v1.0 contract yet
│
└── pages/
    ├── Landing.jsx, Login.jsx, Signup.jsx, ForgotPassword.jsx, ResetPassword.jsx
    ├── Dashboard.jsx
    ├── Agents.jsx, AgentDetails.jsx
    ├── Observations.jsx, ObservationDetails.jsx
    ├── Alerts.jsx, AlertDetails.jsx
    └── Settings.jsx (Workspace / Alert Policy / Notifications / Team tabs)
```

## API integration — how it actually works

Every page calls a function from `src/lib/api/*.js` (e.g. `listAgents()`,
`getAlert(id)`, `acknowledgeAlert(id)`) — never `fetch` directly, and never
mock data directly. Each of those functions has **two code paths**:

```js
export async function listAgents(params = {}) {
  if (MOCK_MODE) {
    // realistic in-memory mock, including pagination/filtering/sorting
    return db.getAgents(params);
  }
  // the real call, once the Backend exists
  return apiFetch(`/agents${toQueryString(params)}`);
}
```

### Switching from mock data to the real Backend

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the real API's base URL.
2. Open `src/lib/apiClient.js` and set `export const MOCK_MODE = false;`
3. That's it — every page already calls the real endpoints; nothing in the
   pages themselves needs to change.

### What's official vs. extended

- `api/auth.js`, `api/agents.js`, `api/observations.js`, `api/alerts.js`,
  `api/dashboard.js` — endpoints, request/response shapes, and error format
  match the frozen v1.0 API documentation (`API_OVERVIEW.md`,
  `AUTHENTICATION_API.md`, `AGENTS_API.md`, `OBSERVATIONS_API.md`,
  `ALERTS_API.md`, `DASHBOARD_API.md`, `API_ERROR_CODES.md`, `PAGINATION.md`).
- `api/team.js` (Settings → Team tab) and the `signup`/`forgot-password`/
  `reset-password` functions in `api/auth.js` are **not** part of the frozen
  contract — they're proposed/extended endpoints and need sign-off from the
  Backend team before being treated as real.

### Error handling

Every error thrown by an `api/*.js` function is an `ApiError` with `.code`,
`.message`, and `.details` — matching the standard envelope from
`API_ERROR_CODES.md`:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }
```

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173
