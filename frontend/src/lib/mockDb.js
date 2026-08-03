// In-memory mock "database" backing every mock API module under src/lib/api/.
// Unlike static mockData.js, this supports real mutations (archive an agent,
// acknowledge an alert, rotate a key) that persist for the rest of the
// session, and real pagination/filtering/sorting — so the pages behave
// exactly as they will against the real Backend.

let agents = [
  {
    id: "agt_789", name: "Finance Assistant", framework: "CrewAI", version: "1.2.0",
    status: "active", risk_level: "low", last_activity_at: "2026-07-25T09:45:00Z",
    total_observations: 3200, total_alerts: 2, description: "Reviews invoices and generates financial reports.",
    api_key: "ases_live_a1b2c3d4e5f6",
  },
  {
    id: "agt_790", name: "Support Agent", framework: "LangChain", version: "0.9.4",
    status: "active", risk_level: "medium", last_activity_at: "2026-07-25T10:02:00Z",
    total_observations: 1890, total_alerts: 1, description: "Handles customer support tickets and refunds.",
    api_key: "ases_live_f6e5d4c3b2a1",
  },
  {
    id: "agt_791", name: "Sales Agent", framework: "CrewAI", version: "1.1.0",
    status: "active", risk_level: "low", last_activity_at: "2026-07-25T08:30:00Z",
    total_observations: 980, total_alerts: 0, description: "Qualifies leads and drafts outbound emails.",
    api_key: "ases_live_9z8y7x6w5v4u",
  },
  {
    id: "agt_792", name: "Research Agent", framework: "Custom", version: "0.4.1",
    status: "archived", risk_level: "low", last_activity_at: "2026-06-01T00:00:00Z",
    total_observations: 210, total_alerts: 0, description: "Summarizes market research documents.",
    api_key: "ases_live_1a2b3c4d5e6f",
  },
];

let observations = [
  {
    id: "obs_001", agent_id: "agt_789", agent_name: "Finance Assistant",
    verdict: "Benign", confidence: 0.97, risk_score: 8, created_at: "2026-07-25T09:00:00Z",
    context: { framework: "CrewAI", agent_version: "1.2.0", environment: "production", started_at: "2026-07-21T10:15:00Z", finished_at: "2026-07-21T10:15:08Z" },
    events: [
      { sequence: 1, timestamp: "2026-07-21T10:15:01Z", event_type: "api_call", resource: "OpenAI API", operation: "POST", result: "success" },
      { sequence: 2, timestamp: "2026-07-21T10:15:03Z", event_type: "file_access", resource: "invoices_june.xlsx", operation: "read", result: "success" },
    ],
  },
  {
    id: "obs_002", agent_id: "agt_790", agent_name: "Support Agent",
    verdict: "Suspicious", confidence: 0.91, risk_score: 78, created_at: "2026-07-25T09:50:00Z",
    context: { framework: "LangChain", agent_version: "0.9.4", environment: "production", started_at: "2026-07-25T09:49:52Z", finished_at: "2026-07-25T09:50:00Z" },
    events: [
      { sequence: 1, timestamp: "2026-07-25T09:49:53Z", event_type: "api_call", resource: "OpenAI API", operation: "POST", result: "success" },
      { sequence: 2, timestamp: "2026-07-25T09:49:55Z", event_type: "file_access", resource: "/etc/shadow", operation: "read", result: "success" },
      { sequence: 3, timestamp: "2026-07-25T09:49:58Z", event_type: "network_connection", resource: "185.220.101.4", operation: "connect", result: "success" },
    ],
  },
];

let alerts = [
  {
    id: "alt_555", agent_id: "agt_790", agent_name: "Support Agent",
    severity: "critical", prediction: "Malicious", confidence: 0.98, risk_score: 92,
    status: "open", detected_at: "2026-07-25T09:50:00Z",
    reasons: [
      "Prompt injection attempt detected in LLM API call",
      "Sensitive file accessed outside expected scope",
      "Unexpected outbound network connection",
    ],
    evidence: [
      { sequence: 1, evidence_type: "Prompt Injection", reference: "HF-PROMPT-INJECTION", confidence: 0.946 },
      { sequence: 2, evidence_type: "Threat Match", reference: "AML.T0054", confidence: null },
    ],
    related_cves: [{ cve_id: "CVE-2026-1234", severity: "high", exploited_in_wild: true }],
    recommended_actions: ["Isolate the agent temporarily", "Review recent file access logs"],
  },
  {
    id: "alt_556", agent_id: "agt_789", agent_name: "Finance Assistant",
    severity: "medium", prediction: "Suspicious", confidence: 0.72, risk_score: 54,
    status: "acknowledged", detected_at: "2026-07-24T14:10:00Z",
    reasons: ["Unusual tool usage detected"],
    evidence: [{ sequence: 1, evidence_type: "Threat Match", reference: "AML.T0031", confidence: 0.61 }],
    related_cves: [], recommended_actions: ["Confirm with the agent owner this was expected"],
  },
];

export const topThreats = [
  { name: "Prompt Injection", n: 3, sev: "high" },
  { name: "Data Exfiltration Attempt", n: 2, sev: "high" },
  { name: "Unusual Tool Usage", n: 1, sev: "medium" },
  { name: "Policy Violation", n: 1, sev: "low" },
];

export const companyInfo = {
  id: "cmp_456", name: "FutureBank", plan: "free_trial",
  observations_this_month: 12500, observations_limit: 50000,
  agents_count: 5, agents_limit: 20,
};

// --- Organization & Identity Lifecycle (per Session 8) --------------------
//
// Two SEPARATE concepts, matching the doc precisely:
//   - "Members"     -> real accounts with an active Membership in the Org.
//                      The first member is always created as "owner" at
//                      Organization creation time (never chosen).
//   - "Invitations" -> a trust object that exists BEFORE any account is
//                      created. Lifecycle: pending -> accepted | expired | cancelled.
//                      A User/Membership is only created at Accept time —
//                      never at invite time.
//
// Rule enforced here (mock-side, mirroring what the Backend must enforce):
// an Organization must always have at least one "owner" member. Removing
// the last owner, or demoting the last owner, is rejected.

let members = [
  { id: "usr_123", name: "Ahmed", email: "ahmed@futurebank.com", role: "owner", status: "active" },
  { id: "usr_456", name: "Sara", email: "sara@futurebank.com", role: "admin", status: "active" },
];

let invitations = [
  {
    id: "inv_001",
    email: "mohamed@futurebank.com",
    role: "security_analyst",
    status: "pending", // pending | accepted | expired | cancelled
    invited_at: "2026-07-24T10:00:00Z",
    expires_at: "2026-07-31T10:00:00Z",
  },
];

const INVITATION_TTL_DAYS = 7;

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function ownerCount() {
  return members.filter((m) => m.role === "owner" && m.status === "active").length;
}

// --- shared helpers -------------------------------------------------------

export function paginate(list, { page = 1, per_page = 20 } = {}) {
  const total_items = list.length;
  const total_pages = Math.max(1, Math.ceil(total_items / per_page));
  const start = (page - 1) * per_page;
  const data = list.slice(start, start + per_page);
  return { data, pagination: { page: Number(page), per_page: Number(per_page), total_items, total_pages } };
}

function sortBy(list, sort) {
  if (!sort) return list;
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...list].sort((a, b) => {
    if (a[key] === b[key]) return 0;
    const result = a[key] > b[key] ? 1 : -1;
    return desc ? -result : result;
  });
}

// --- accessors used by src/lib/api/*.js mock implementations -------------

export const db = {
  // Agents
  getAgents: (filters = {}) => {
    let list = [...agents];
    if (filters.status) list = list.filter((a) => a.status === filters.status);
    if (filters.framework) list = list.filter((a) => a.framework === filters.framework);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    list = sortBy(list, filters.sort || "-last_activity_at");
    return paginate(list, filters);
  },
  getAgent: (id) => agents.find((a) => a.id === id) || null,
  createAgent: (payload) => {
    const agent = {
      id: `agt_${Math.random().toString(36).slice(2, 8)}`,
      status: "active", risk_level: "low", last_activity_at: new Date().toISOString(),
      total_observations: 0, total_alerts: 0,
      api_key: `ases_live_${Math.random().toString(36).slice(2, 14)}`,
      ...payload,
    };
    agents = [agent, ...agents];
    return agent;
  },
  updateAgent: (id, payload) => {
    agents = agents.map((a) => (a.id === id ? { ...a, ...payload } : a));
    return db.getAgent(id);
  },
  // One-way — Agent archival has no reverse transition on the real Backend
  // (AgentPolicy), so the mock does not offer one either. See CONTRACT-008.
  archiveAgent: (id) => db.updateAgent(id, { status: "archived", archived_at: new Date().toISOString() }),
  rotateApiKey: (id) => {
    const api_key = `ases_live_${Math.random().toString(36).slice(2, 14)}`;
    db.updateAgent(id, { api_key });
    return { id, api_key, rotated_at: new Date().toISOString() };
  },

  // Observations
  getObservations: (filters = {}) => {
    let list = [...observations];
    if (filters.agent_id) list = list.filter((o) => o.agent_id === filters.agent_id);
    if (filters.verdict) list = list.filter((o) => o.verdict.toLowerCase() === filters.verdict.toLowerCase());
    list = sortBy(list, filters.sort || "-created_at");
    return paginate(list, filters);
  },
  getObservation: (id) => observations.find((o) => o.id === id) || null,

  // Alerts
  getAlerts: (filters = {}) => {
    let list = [...alerts];
    if (filters.status) list = list.filter((a) => a.status === filters.status);
    if (filters.severity) list = list.filter((a) => a.severity === filters.severity);
    if (filters.agent_id) list = list.filter((a) => a.agent_id === filters.agent_id);
    list = sortBy(list, filters.sort || "-detected_at");
    return paginate(list, filters);
  },
  getAlert: (id) => alerts.find((a) => a.id === id) || null,
  updateAlertStatus: (id, status) => {
    const extra = status === "acknowledged"
      ? { acknowledged_by: "usr_123", acknowledged_at: new Date().toISOString() }
      : status === "resolved"
      ? { resolved_by: "usr_123", resolved_at: new Date().toISOString() }
      : {};
    alerts = alerts.map((a) => (a.id === id ? { ...a, status, ...extra } : a));
    return db.getAlert(id);
  },

  // Dashboard (aggregate)
  getDashboard: () => {
    const openAlerts = alerts.filter((a) => a.status === "open").length;
    const activeAgents = agents.filter((a) => a.status === "active").length;
    return {
      stats: {
        total_agents: agents.length,
        active_agents: activeAgents,
        total_observations_today: 18400,
        open_alerts: openAlerts,
      },
      recent_alerts: alerts.slice(0, 5),
      recent_observations: observations.slice(0, 5),
      risk_distribution: { benign: 320, suspicious: 15, malicious: 5 },
    };
  },

  // --- Organization & Identity Lifecycle -----------------------------

  getMembers: () => members.filter((m) => m.status !== "removed"),

  getInvitations: () => invitations,

  /**
   * Creates a PENDING invitation only — never a User/Membership directly.
   * Per Session 8: "The Backend does not create a User at invite time. It
   * creates an Invitation. The User is only created at Accept time."
   */
  inviteMember: (email, role) => {
    const now = new Date().toISOString();
    const existingActiveMember = members.find((m) => m.email.toLowerCase() === email.toLowerCase() && m.status === "active");
    if (existingActiveMember) {
      throw new Error("This person is already a member of the organization");
    }
    const existingPendingInvite = invitations.find(
      (i) => i.email.toLowerCase() === email.toLowerCase() && i.status === "pending"
    );
    if (existingPendingInvite) {
      throw new Error("This person already has a pending invitation");
    }
    const invitation = {
      id: `inv_${Math.random().toString(36).slice(2, 8)}`,
      email,
      role,
      status: "pending",
      invited_at: now,
      expires_at: addDays(now, INVITATION_TTL_DAYS),
    };
    invitations = [...invitations, invitation];
    return invitation;
  },

  /** Refreshes invited_at/expires_at without changing the invitation's identity. */
  resendInvitation: (id) => {
    const now = new Date().toISOString();
    invitations = invitations.map((i) =>
      i.id === id && i.status === "pending" ? { ...i, invited_at: now, expires_at: addDays(now, INVITATION_TTL_DAYS) } : i
    );
    return invitations.find((i) => i.id === id) || null;
  },

  /** Owner changed their mind before the invite was accepted. */
  cancelInvitation: (id) => {
    invitations = invitations.map((i) => (i.id === id ? { ...i, status: "cancelled" } : i));
    return invitations.find((i) => i.id === id) || null;
  },

  /**
   * Simulates the invited person clicking "Accept Invitation": this is the
   * ONLY point where a real Member/User is created, per Session 8.
   */
  acceptInvitation: (id, name) => {
    const invitation = invitations.find((i) => i.id === id);
    if (!invitation || invitation.status !== "pending") {
      throw new Error("This invitation is no longer valid");
    }
    const member = {
      id: `usr_${Math.random().toString(36).slice(2, 8)}`,
      name,
      email: invitation.email,
      role: invitation.role,
      status: "active",
    };
    members = [...members, member];
    invitations = invitations.map((i) => (i.id === id ? { ...i, status: "accepted" } : i));
    return member;
  },

  /**
   * Removing a member never hard-deletes their account (per Session 8) —
   * in this single-organization MVP model that distinction doesn't show up
   * in the UI yet, but the "at least one owner" rule IS enforced here,
   * matching: "an Organization must always have an Owner."
   */
  removeMember: (id) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    if (member.role === "owner" && ownerCount() <= 1) {
      throw new Error("An organization must always have at least one Owner — transfer ownership first");
    }
    members = members.map((m) => (m.id === id ? { ...m, status: "removed" } : m));
  },

  /**
   * Role changes are read from the database on every request (Session 6 /
   * Session 8), never cached in a token — this function is the single
   * place that mutates the source of truth for a member's role.
   */
  updateMemberRole: (id, role) => {
    const member = members.find((m) => m.id === id);
    if (!member) throw new Error("Member not found");
    if (member.role === "owner" && role !== "owner" && ownerCount() <= 1) {
      throw new Error("Cannot demote the last remaining Owner");
    }
    members = members.map((m) => (m.id === id ? { ...m, role } : m));
    return members.find((m) => m.id === id);
  },
};
