import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError } from "../components/ui/PageState.jsx";
import { getAlert, acknowledgeAlert, resolveAlert } from "../lib/api/alerts.js";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AlertDetails() {
  const { alertId } = useParams();
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("summary");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    setAlert(null);
    try {
      const res = await getAlert(alertId);
      setAlert(res);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    setTab("summary");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId]);

  async function handleAcknowledge() {
    setBusy(true);
    try {
      const updated = await acknowledgeAlert(alertId);
      setAlert((prev) => ({ ...prev, ...updated }));
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve() {
    setBusy(true);
    try {
      const updated = await resolveAlert(alertId);
      setAlert((prev) => ({ ...prev, ...updated }));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <PageError message={error} onRetry={load} />;
  if (!alert) return <PageLoader />;

  return (
    <div>
      <Topbar
        icon={AlertTriangle}
        title={`Alert · ${alert.agent_name}`}
        subtitle={alert.id}
        actions={
          <>
            <button
              onClick={handleAcknowledge}
              disabled={busy || alert.status !== "open"}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Acknowledge
            </button>
            <button
              onClick={handleResolve}
              disabled={busy || alert.status === "resolved"}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#07080f] transition hover:bg-white/90 disabled:opacity-40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-rose-500/20 bg-rose-500/[0.08] px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-rose-300">
                <AlertTriangle className="h-4 w-4" /> {alert.reasons[0]}
              </div>
              <Badge tone={alert.severity}>{alert.severity}</Badge>
            </div>

            <div className="flex gap-5 border-b border-white/[0.06] px-5 pt-4 text-xs text-white/35">
              {["summary", "timeline", "evidence"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 capitalize transition ${tab === t ? "border-b-2 border-indigo-400 text-white" : "hover:text-white/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "summary" && (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="mb-2 text-white/40">Why this was flagged</div>
                    <ul className="space-y-1.5">
                      {alert.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-white/40">Recommended actions</div>
                    <ul className="space-y-1.5">
                      {alert.recommended_actions.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {tab === "timeline" && (
                <div className="text-sm text-white/50">
                  Detected at {new Date(alert.detected_at).toLocaleString()}. Full event timeline available on the
                  related Observation page.
                </div>
              )}

              {tab === "evidence" && (
                <div className="space-y-2.5">
                  {alert.evidence.map((e) => (
                    <div key={e.sequence} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="text-sm text-white/70">{e.evidence_type}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-white/35">
                        {e.reference} {e.confidence != null && `· ${Math.round(e.confidence * 100)}%`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={100}>
          <GlassCard className="p-6">
            <div className="mb-4 text-sm font-medium text-white">Details</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Confidence</span>
                <span className="text-white">{Math.round(alert.confidence * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Risk Score</span>
                <span className="text-white">{alert.risk_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Status</span>
                <Badge tone={alert.status}>{alert.status}</Badge>
              </div>
              {alert.related_cves.length > 0 && (
                <div className="border-t border-white/[0.06] pt-3">
                  <div className="mb-2 text-white/40">Related CVEs</div>
                  {alert.related_cves.map((c) => (
                    <div key={c.cve_id} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{c.cve_id}</span>
                      {c.exploited_in_wild && <Badge tone="high">Exploited in the wild</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
