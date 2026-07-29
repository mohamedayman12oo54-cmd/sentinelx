import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError, EmptyState } from "../components/ui/PageState.jsx";
import { listObservations } from "../lib/api/observations.js";
import { Activity } from "lucide-react";

export default function Observations() {
  const [observations, setObservations] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    setObservations(null);
    try {
      const res = await listObservations({ sort: "-created_at" });
      setObservations(res.data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar icon={Activity} title="Observations" subtitle="Every batch of activity submitted by your agents." />

      {error && <PageError message={error} onRetry={load} />}
      {!error && !observations && <PageLoader />}
      {!error && observations && observations.length === 0 && (
        <EmptyState icon={Activity} message="No observations submitted yet." />
      )}

      {!error && observations && observations.length > 0 && (
        <Reveal>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-white/35">
                  <th className="px-5 py-3.5 font-medium">Agent</th>
                  <th className="px-5 py-3.5 font-medium">Verdict</th>
                  <th className="px-5 py-3.5 font-medium">Confidence</th>
                  <th className="px-5 py-3.5 font-medium">Risk Score</th>
                  <th className="px-5 py-3.5 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <Link to={`/observations/${o.id}`} className="flex items-center gap-2.5 font-medium text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
                          <Activity className="h-4 w-4 text-indigo-400" />
                        </span>
                        {o.agent_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4"><Badge tone={o.verdict === "Benign" ? "low" : o.verdict === "Suspicious" ? "medium" : "high"}>{o.verdict}</Badge></td>
                    <td className="px-5 py-4 text-white/50">{Math.round(o.confidence * 100)}%</td>
                    <td className="px-5 py-4 text-white/50">{o.risk_score}</td>
                    <td className="px-5 py-4 text-white/35">{new Date(o.created_at).toLocaleString()}</td>
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
