import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError, EmptyState } from "../components/ui/PageState.jsx";
import { listAgents } from "../lib/api/agents.js";
import { Bot, Plus } from "lucide-react";

export default function Agents() {
  const [agents, setAgents] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    setAgents(null);
    try {
      const res = await listAgents({ sort: "-last_activity_at" });
      setAgents(res.data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar
        icon={Bot}
        title="Agents"
        subtitle="Every AI agent connected to SentinelX."
        actions={
          <button className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#07080f] transition hover:bg-white/90">
            <Plus className="h-4 w-4" /> Register agent
          </button>
        }
      />

      {error && <PageError message={error} onRetry={load} />}
      {!error && !agents && <PageLoader />}
      {!error && agents && agents.length === 0 && <EmptyState icon={Bot} message="No agents registered yet." />}

      {!error && agents && agents.length > 0 && (
        <Reveal>
          <GlassCard className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-white/35">
                  <th className="px-5 py-3.5 font-medium">Agent</th>
                  <th className="px-5 py-3.5 font-medium">Framework</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Risk</th>
                  <th className="px-5 py-3.5 font-medium">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-white/[0.04] transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <Link to={`/agents/${a.id}`} className="flex items-center gap-2.5 font-medium text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
                          <Bot className="h-4 w-4 text-indigo-400" />
                        </span>
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-white/50">{a.framework}</td>
                    <td className="px-5 py-4"><Badge tone={a.status}>{a.status}</Badge></td>
                    <td className="px-5 py-4"><Badge tone={a.risk_level}>{a.risk_level}</Badge></td>
                    <td className="px-5 py-4 text-white/35">{new Date(a.last_activity_at).toLocaleString()}</td>
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
