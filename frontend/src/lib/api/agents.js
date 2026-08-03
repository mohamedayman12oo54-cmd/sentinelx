// Agents API — matches AGENTS_API.md exactly.
//   GET    /api/v1/agents
//   POST   /api/v1/agents
//   GET    /api/v1/agents/{agentId}
//   PATCH  /api/v1/agents/{agentId}
//   PATCH  /api/v1/agents/{agentId}/archive
//   POST   /api/v1/agents/{agentId}/rotate-api-key
//   GET    /api/v1/agents/{agentId}/observations
//
// No DELETE — archiving preserves agents for historical integrity (per
// API_CONVENTIONS.md: "DELETE | Not used for business entities in Version 1").
//
// No reactivate — Agent archival is a deliberate, one-way transition on the
// Backend (AgentPolicy has no reverse path, and no /agents/{id}/reactivate
// route exists). See CONTRACT-008 / STATE-001.

import { apiFetch, toQueryString, MOCK_MODE, ApiError } from "../apiClient.js";
import { db } from "../mockDb.js";

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listAgents(params = {}) {
  if (MOCK_MODE) {
    await delay();
    return db.getAgents(params);
  }
  return apiFetch(`/agents${toQueryString(params)}`);
}

export async function createAgent(payload) {
  if (MOCK_MODE) {
    await delay();
    if (!payload.name) throw new ApiError("VALIDATION_ERROR", "Agent name is required", { field: "name" });
    return db.createAgent(payload);
  }
  return apiFetch("/agents", { method: "POST", body: payload });
}

export async function getAgent(agentId) {
  if (MOCK_MODE) {
    await delay();
    const agent = db.getAgent(agentId);
    if (!agent) throw new ApiError("NOT_FOUND", `Agent '${agentId}' was not found`);
    return agent;
  }
  return apiFetch(`/agents/${agentId}`);
}

export async function updateAgent(agentId, payload) {
  if (MOCK_MODE) {
    await delay();
    return db.updateAgent(agentId, payload);
  }
  return apiFetch(`/agents/${agentId}`, { method: "PATCH", body: payload });
}

export async function archiveAgent(agentId) {
  if (MOCK_MODE) {
    await delay();
    return db.archiveAgent(agentId);
  }
  return apiFetch(`/agents/${agentId}/archive`, { method: "PATCH" });
}

export async function rotateApiKey(agentId) {
  if (MOCK_MODE) {
    await delay();
    return db.rotateApiKey(agentId);
  }
  return apiFetch(`/agents/${agentId}/rotate-api-key`, { method: "POST" });
}

export async function listAgentObservations(agentId, params = {}) {
  if (MOCK_MODE) {
    await delay();
    return db.getObservations({ ...params, agent_id: agentId });
  }
  return apiFetch(`/agents/${agentId}/observations${toQueryString(params)}`);
}
