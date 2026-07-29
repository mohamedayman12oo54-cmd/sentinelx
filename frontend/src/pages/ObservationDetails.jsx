import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Badge from "../components/ui/Badge.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import { PageLoader, PageError } from "../components/ui/PageState.jsx";
import { getObservation } from "../lib/api/observations.js";
import { Activity } from "lucide-react";

export default function ObservationDetails() {
  const { observationId } = useParams();
  const [obs, setObs] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    setObs(null);
    try {
      const res = await getObservation(observationId);
      setObs(res);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observationId]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!obs) return <PageLoader />;

  return (
    <div>
      <Topbar icon={Activity} title={`Observation · ${obs.agent_name}`} subtitle={obs.id} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="mb-4 text-sm font-medium text-white">Event Timeline</div>
            <div className="space-y-2">
              {obs.events.map((e) => (
                <div key={e.sequence} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 font-mono text-[12px]">
                  <span className="text-white/30">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span className="w-32 shrink-0 text-white/70">{e.event_type}</span>
                  <span className="truncate text-white/40">{e.resource}</span>
                  <span className="ml-auto text-white/30">{e.result}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        <Reveal delay={100}>
          <GlassCard className="p-6">
            <div className="mb-4 text-sm font-medium text-white">Prediction</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Verdict</span>
                <Badge tone={obs.verdict === "Benign" ? "low" : obs.verdict === "Suspicious" ? "medium" : "high"}>{obs.verdict}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Confidence</span>
                <span className="text-white">{Math.round(obs.confidence * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Risk Score</span>
                <span className="text-white">{obs.risk_score}</span>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <div className="text-white/40">Context</div>
                <div className="mt-2 space-y-1 text-xs text-white/50">
                  <div>Framework: {obs.context.framework}</div>
                  <div>Version: {obs.context.agent_version}</div>
                  <div>Environment: {obs.context.environment}</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}
