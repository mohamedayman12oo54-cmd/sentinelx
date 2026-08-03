import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError } from "../components/ui/PageState.jsx";
import { getAgent, archiveAgent, rotateApiKey, listAgentObservations } from "../lib/api/agents.js";
import { listAlerts } from "../lib/api/alerts.js";
import { Bot, ArrowRight, KeyRound, Archive, Copy, CheckCircle2 } from "lucide-react";

export default function AgentDetails() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [observations, setObservations] = useState([]);
  const [agentAlerts, setAgentAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setError(null);
    setAgent(null);
    try {
      const [agentRes, obsRes, alertsRes] = await Promise.all([
        getAgent(agentId),
        listAgentObservations(agentId),
        listAlerts({ agent_id: agentId }),
      ]);
      setAgent(agentRes);
      setObservations(obsRes.data);
      setAgentAlerts(alertsRes.data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    setNewKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // One-way — Agent archival has no reverse transition on the real Backend
  // (AgentPolicy), so there is nothing to toggle back. See CONTRACT-008.
  async function handleArchive() {
    setBusy(true);
    try {
      const updated = await archiveAgent(agentId);
      setAgent((prev) => ({ ...prev, ...updated }));
    } finally {
      setBusy(false);
    }
  }

  async function handleRotateKey() {
    setBusy(true);
    try {
      const res = await rotateApiKey(agentId);
      setNewKey(res.api_key);
      setAgent((prev) => ({ ...prev, api_key: res.api_key }));
    } finally {
      setBusy(false);
    }
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard?.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) return <PageError message={error} onRetry={load} />;
  if (!agent) return <PageLoader />;

  return (
    <div>
      <Topbar
        icon={Bot}
        title={agent.name}
        subtitle={agent.description}
        actions={
          <>
            <button
              onClick={handleRotateKey}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" /> Rotate API Key
            </button>
            {/* Archival is one-way (CONTRACT-008/STATE-001) — an already-Archived
                Agent gets no action button to leave that state, matching the
                real Backend's actual, deliberate state machine. Compared against
                the Backend's real (uppercase) enum value — see CONTRACT-010. */}
            {agent.status !== "ARCHIVED" && (
              <button
                onClick={handleArchive}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            )}
          </>
        }
      />

      {newKey && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            New API key generated — copy it now, it won't be shown again: <code className="text-white/80">{newKey}</code>
          </div>
          <button onClick={copyKey} className="flex shrink-0 items-center gap-1 rounded-md border border-white/[0.1] px-2.5 py-1.5 text-white/60 hover:bg-white/[0.05]">
            <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard className="p-4">
          <div className="text-[10px] text-white/35">Framework</div>
          <div className="mt-1 text-sm font-semibold text-white">{agent.framework}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-[10px] text-white/35">Version</div>
          <div className="mt-1 text-sm font-semibold text-white">{agent.version}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-[10px] text-white/35">Status</div>
          {/* Badge's style tokens are lowercase; the Backend's real status
              values are uppercase (CONTRACT-010/STATE-007) — normalized here
              at the display call site, not hidden in the API client. */}
          <div className="mt-1"><Badge tone={agent.status?.toLowerCase()}>{agent.status?.toLowerCase()}</Badge></div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-[10px] text-white/35">Risk Level</div>
          <div className="mt-1"><Badge tone={agent.risk_level}>{agent.risk_level}</Badge></div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Recent Observations</span>
              <Bot className="h-4 w-4 text-white/30" />
            </div>
            <div className="space-y-2.5">
              {observations.length === 0 && <p className="text-sm text-white/30">No observations yet.</p>}
              {observations.map((o) => (
                <Link
                  key={o.id}
                  to={`/observations/${o.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-sm transition hover:bg-white/[0.05]"
                >
                  <span className="text-white/60">{new Date(o.created_at).toLocaleString()}</span>
                  <Badge tone={o.verdict === "SAFE" ? "low" : o.verdict === "SUSPICIOUS" ? "medium" : "high"}>{o.verdict}</Badge>
                </Link>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={100}>
          <GlassCard className="p-6">
            <div className="mb-4 text-sm font-medium text-white">Related Alerts</div>
            <div className="space-y-2.5">
              {agentAlerts.length === 0 && <p className="text-sm text-white/30">No alerts for this agent.</p>}
              {agentAlerts.map((a) => (
                <Link
                  key={a.id}
                  to={`/alerts/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-sm transition hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-2 text-white/60">
                    {a.reasons[0]} <ArrowRight className="h-3 w-3 text-white/20" />
                  </span>
                  <Badge tone={a.severity}>{a.severity}</Badge>
                </Link>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
