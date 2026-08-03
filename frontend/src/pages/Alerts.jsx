import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError, EmptyState } from "../components/ui/PageState.jsx";
import { listAlerts } from "../lib/api/alerts.js";
import { AlertTriangle } from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    setAlerts(null);
    try {
      const res = await listAlerts({ sort: "-detected_at" });
      setAlerts(res.data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar icon={AlertTriangle} title="Alerts" subtitle="Behavior that needs a human decision." />

      {error && <PageError message={error} onRetry={load} />}
      {!error && !alerts && <PageLoader />}
      {!error && alerts && alerts.length === 0 && <EmptyState icon={AlertTriangle} message="No alerts — everything looks calm." />}

      {!error && alerts && alerts.length > 0 && (
        <Reveal>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-white/35">
                  <th className="px-5 py-3.5 font-medium">Agent</th>
                  <th className="px-5 py-3.5 font-medium">Severity</th>
                  <th className="px-5 py-3.5 font-medium">Risk Score</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Detected</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <Link to={`/alerts/${a.id}`} className="flex items-center gap-2.5 font-medium text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        </span>
                        {a.agent_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4"><Badge tone={a.severity}>{a.severity}</Badge></td>
                    <td className="px-5 py-4 text-white/50">{a.risk_score}</td>
                    <td className="px-5 py-4"><Badge tone={a.status?.toLowerCase()}>{a.status?.toLowerCase()}</Badge></td>
                    <td className="px-5 py-4 text-white/35">{new Date(a.detected_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </Reveal>
      )}
    </div>
  );
}
