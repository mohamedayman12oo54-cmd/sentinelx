// Observations API — matches OBSERVATIONS_API.md exactly.
//   GET /api/v1/observations
//   GET /api/v1/observations/{observationId}
//
// Note: POST /api/v1/observations exists in the contract but is SDK-only
// (authenticated with an Agent API Key) — the dashboard frontend never
// creates Observations directly, so it is intentionally not exposed here.

import { apiFetch, toQueryString, MOCK_MODE, ApiError } from "../apiClient.js";
import { db } from "../mockDb.js";

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listObservations(params = {}) {
  if (MOCK_MODE) {
    await delay();
    return db.getObservations(params);
  }
  return apiFetch(`/observations${toQueryString(params)}`);
}

export async function getObservation(observationId) {
  if (MOCK_MODE) {
    await delay();
    const obs = db.getObservation(observationId);
    if (!obs) throw new ApiError("NOT_FOUND", `Observation '${observationId}' was not found`);
    return obs;
  }
  return apiFetch(`/observations/${observationId}`);
}
