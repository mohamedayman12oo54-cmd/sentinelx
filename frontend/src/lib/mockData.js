// Stand-in data shaped exactly like the SentinelX API contract responses.
// Swap these for real fetch() calls to /api/v1/... once the backend is live.

export const agents = [
  {
    id: "agt_789",
    name: "Finance Assistant",
    framework: "CrewAI",
    version: "1.2.0",
    status: "active",
    risk_level: "low",
    last_activity_at: "2026-07-25T09:45:00Z",
    total_observations: 3200,
    total_alerts: 2,
    description: "Reviews invoices and generates financial reports.",
  },
  {
    id: "agt_790",
    name: "Support Agent",
    framework: "LangChain",
    version: "0.9.4",
    status: "active",
    risk_level: "medium",
    last_activity_at: "2026-07-25T10:02:00Z",
    total_observations: 1890,
    total_alerts: 1,
    description: "Handles customer support tickets and refunds.",
  },
  {
    id: "agt_791",
    name: "Sales Agent",
    framework: "CrewAI",
    version: "1.1.0",
    status: "active",
    risk_level: "low",
    last_activity_at: "2026-07-25T08:30:00Z",
    total_observations: 980,
    total_alerts: 0,
    description: "Qualifies leads and drafts outbound emails.",
  },
  {
    id: "agt_792",
    name: "Research Agent",
    framework: "Custom",
    version: "0.4.1",
    status: "archived",
    risk_level: "low",
    last_activity_at: "2026-06-01T00:00:00Z",
    total_observations: 210,
    total_alerts: 0,
    description: "Summarizes market research documents.",
  },
];

export const observations = [
  {
    id: "obs_001",
    agent_id: "agt_789",
    agent_name: "Finance Assistant",
    verdict: "Benign",
    confidence: 0.97,
    risk_score: 8,
    created_at: "2026-07-25T09:00:00Z",
    context: {
      framework: "CrewAI",
      agent_version: "1.2.0",
      environment: "production",
      started_at: "2026-07-21T10:15:00Z",
      finished_at: "2026-07-21T10:15:08Z",
    },
    events: [
      { sequence: 1, timestamp: "2026-07-21T10:15:01Z", event_type: "api_call", resource: "OpenAI API", operation: "POST", result: "success" },
      { sequence: 2, timestamp: "2026-07-21T10:15:03Z", event_type: "file_access", resource: "invoices_june.xlsx", operation: "read", result: "success" },
    ],
  },
  {
    id: "obs_002",
    agent_id: "agt_790",
    agent_name: "Support Agent",
    verdict: "Suspicious",
    confidence: 0.91,
    risk_score: 78,
    created_at: "2026-07-25T09:50:00Z",
    context: {
      framework: "LangChain",
      agent_version: "0.9.4",
      environment: "production",
      started_at: "2026-07-25T09:49:52Z",
      finished_at: "2026-07-25T09:50:00Z",
    },
    events: [
      { sequence: 1, timestamp: "2026-07-25T09:49:53Z", event_type: "api_call", resource: "OpenAI API", operation: "POST", result: "success" },
      { sequence: 2, timestamp: "2026-07-25T09:49:55Z", event_type: "file_access", resource: "/etc/shadow", operation: "read", result: "success" },
      { sequence: 3, timestamp: "2026-07-25T09:49:58Z", event_type: "network_connection", resource: "185.220.101.4", operation: "connect", result: "success" },
    ],
  },
];

export const alerts = [
  {
    id: "alt_555",
    agent_id: "agt_790",
    agent_name: "Support Agent",
    severity: "critical",
    prediction: "Malicious",
    confidence: 0.98,
    risk_score: 92,
    status: "open",
    detected_at: "2026-07-25T09:50:00Z",
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
    id: "alt_556",
    agent_id: "agt_789",
    agent_name: "Finance Assistant",
    severity: "medium",
    prediction: "Suspicious",
    confidence: 0.72,
    risk_score: 54,
    status: "acknowledged",
    detected_at: "2026-07-24T14:10:00Z",
    reasons: ["Unusual tool usage detected"],
    evidence: [{ sequence: 1, evidence_type: "Threat Match", reference: "AML.T0031", confidence: 0.61 }],
    related_cves: [],
    recommended_actions: ["Confirm with the agent owner this was expected"],
  },
];

export const dashboardStats = {
  stats: {
    total_agents: 24,
    active_agents: 21,
    total_observations_today: 18400,
    open_alerts: 7,
  },
  risk_distribution: { benign: 320, suspicious: 15, malicious: 5 },
  requests_over_time: [50, 42, 48, 25, 32, 15, 28, 10, 20, 18, 30, 22],
};

export const topThreats = [
  { name: "Prompt Injection", n: 3, sev: "high" },
  { name: "Data Exfiltration Attempt", n: 2, sev: "high" },
  { name: "Unusual Tool Usage", n: 1, sev: "medium" },
  { name: "Policy Violation", n: 1, sev: "low" },
];

export const teamMembers = [
  { id: "usr_123", name: "Ahmed", email: "ahmed@futurebank.com", role: "admin", status: "active" },
  { id: "usr_456", name: "Sara", email: "sara@futurebank.com", role: "security_analyst", status: "active" },
  { id: "usr_789", name: "Mohamed", email: "mohamed@futurebank.com", role: "security_analyst", status: "invited" },
];

export const companyInfo = {
  id: "cmp_456",
  name: "FutureBank",
  plan: "free_trial",
  observations_this_month: 12500,
  observations_limit: 50000,
  agents_count: 5,
  agents_limit: 20,
};
