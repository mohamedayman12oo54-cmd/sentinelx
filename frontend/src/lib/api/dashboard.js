// Dashboard API — matches DASHBOARD_API.md exactly.
//   GET /api/v1/dashboard
//
// A single aggregated response (stats, recent alerts/observations, risk
// distribution) so the frontend doesn't have to make several requests just
// to render the landing screen after login.

import { apiFetch, MOCK_MODE } from "../apiClient.js";
import { db } from "../mockDb.js";

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDashboard() {
  if (MOCK_MODE) {
    await delay();
    return db.getDashboard();
  }
  return apiFetch("/dashboard");
}
