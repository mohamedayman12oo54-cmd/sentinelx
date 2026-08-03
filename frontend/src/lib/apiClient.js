// Central HTTP client for the SentinelX REST API.
//
// Built to match the frozen API documentation exactly:
//   - Base URL: /api/v1                              (API_OVERVIEW.md, API_CONVENTIONS.md)
//   - Error shape: { error: { code, message, details } }  (API_ERROR_CODES.md)
//   - Two auth mechanisms: JWT (dashboard users) / API Key (SDK — not used from this app)
//   - Every timestamp is ISO 8601 UTC                  (API_CONVENTIONS.md)
//   - DELETE is not used for business entities in V1   (API_CONVENTIONS.md)
//
// MOCK_MODE lets the whole frontend run against realistic in-memory data
// (src/lib/mockDb.js) instead of a live Backend. Every resource module under
// src/lib/api/*.js has two code paths — mock and real — gated by this flag.
//
// Driven by VITE_MOCK_MODE (see .env.example) rather than hardcoded, so the
// real code path is actually exercised in normal development instead of
// silently going untested indefinitely — see integration audit CONTRACT-005
// through CONTRACT-010 / PERF-001, all of which trace back to this flag
// never having been disabled in this codebase's history. Defaults to real
// mode (false) when unset; set VITE_MOCK_MODE=true locally for demo/offline
// use.
export const MOCK_MODE = (import.meta.env?.VITE_MOCK_MODE ?? "false") === "true";

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api/v1";

/**
 * A normalized API error. Always carries a machine-readable `code` (per
 * API_ERROR_CODES.md) in addition to the standard Error `message`, so callers
 * can branch on `err.code` instead of parsing message strings.
 */
export class ApiError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

function getStoredToken() {
  return typeof window !== "undefined" ? localStorage.getItem("sentinelx_access_token") : null;
}

/**
 * Thin fetch wrapper: attaches the JWT, parses the standard error envelope,
 * and throws an ApiError on any non-2xx response so calling code can use a
 * single try/catch regardless of which endpoint failed.
 */
export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = getStoredToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no JSON body (e.g. some error responses) — fall through with payload = null
  }

  if (!res.ok) {
    const err = payload?.error || {};
    throw new ApiError(err.code || "UNKNOWN_ERROR", err.message || res.statusText, err.details || {});
  }

  return payload;
}

/**
 * Builds a query string from a params object, skipping undefined/null/empty
 * values, matching the filtering/sorting/pagination conventions documented
 * for collection endpoints (page, per_page, sort, search, status, etc).
 */
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
