import React, { useState, useEffect } from "react";
import Topbar from "../components/ui/Topbar.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Reveal from "../components/ui/Reveal.jsx";
import Badge from "../components/ui/Badge.jsx";
import SaveButton from "../components/ui/SaveButton.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { companyInfo } from "../lib/mockDb.js";
import {
  listMembers, listInvitations, inviteMember, resendInvitation, cancelInvitation, removeMember, updateMemberRole,
} from "../lib/api/team.js";
import {
  Settings as SettingsIcon, Bell, ShieldAlert, Building2, Users,
  Mail, Trash2, UserPlus, AlertCircle, Clock, RotateCw, XCircle,
} from "lucide-react";

const TABS = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "alerts", label: "Alert Policy", icon: ShieldAlert },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
];

// Simulates a real save call with a chance to fail, so the feedback states
// (saving / saved / error) actually mean something instead of always succeeding.
function fakeSave() {
  return new Promise((resolve, reject) => {
    setTimeout(() => (Math.random() > 0.08 ? resolve() : reject(new Error("Network error"))), 700);
  });
}

function useSaveStatus() {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);

  async function save() {
    setStatus("saving");
    setErrorMessage(null);
    try {
      await fakeSave();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMessage(e.message);
    }
  }

  return { status, errorMessage, save };
}

function WorkspacePanel() {
  const [name, setName] = useState(companyInfo.name);
  const { status, errorMessage, save } = useSaveStatus();
  const usagePct = Math.round((companyInfo.observations_this_month / companyInfo.observations_limit) * 100);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white">
          <Building2 className="h-4 w-4 text-indigo-400" /> Workspace details
        </div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Company name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400/50 focus:outline-none"
        />
        <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
          Plan: <Badge tone="active">{companyInfo.plan.replace("_", " ")}</Badge>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-4 text-sm font-medium text-white">Usage this month</div>
        <div className="mb-2 flex items-center justify-between text-xs text-white/40">
          <span>Observations</span>
          <span>{companyInfo.observations_this_month.toLocaleString()} / {companyInfo.observations_limit.toLocaleString()}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${usagePct > 85 ? "bg-rose-400" : "bg-gradient-to-r from-indigo-500 to-violet-400"}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-white/40">
          <span>Agents connected</span>
          <span>{companyInfo.agents_count} / {companyInfo.agents_limit}</span>
        </div>
      </GlassCard>

      <SaveButton status={status} errorMessage={errorMessage} onClick={save} />
    </div>
  );
}

function AlertPolicyPanel() {
  const [threshold, setThreshold] = useState(70);
  const [autoResolveDays, setAutoResolveDays] = useState(30);
  const { status, errorMessage, save } = useSaveStatus();

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white">
          <ShieldAlert className="h-4 w-4 text-indigo-400" /> Alert threshold
        </div>
        <label className="mb-2 block text-xs font-medium text-white/50">
          Risk score threshold — alerts fire at or above this score
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <span className="w-10 shrink-0 text-right text-sm font-semibold text-white">{threshold}</span>
        </div>
        <p className="mt-3 text-xs text-white/30">
          Lower values catch more behavior but increase noise. 70 is a reasonable starting point.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <label className="mb-2 block text-xs font-medium text-white/50">
          Auto-resolve low-risk alerts after
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={autoResolveDays}
            onChange={(e) => setAutoResolveDays(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-sm text-white focus:border-indigo-400/50 focus:outline-none"
          />
          <span className="text-sm text-white/40">days</span>
        </div>
      </GlassCard>

      <SaveButton status={status} errorMessage={errorMessage} onClick={save} />
    </div>
  );
}

function NotificationsPanel() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [slackUrl, setSlackUrl] = useState("");
  const [slackError, setSlackError] = useState(null);
  const { status, errorMessage, save } = useSaveStatus();

  function handleSave() {
    if (slackUrl && !slackUrl.startsWith("https://hooks.slack.com/")) {
      setSlackError("That doesn't look like a Slack webhook URL");
      return;
    }
    setSlackError(null);
    save();
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium text-white">
          <Bell className="h-4 w-4 text-indigo-400" /> Alert notifications
        </div>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <div className="text-sm text-white/70">Email alerts</div>
              <div className="text-xs text-white/30">Get emailed whenever a new alert is created</div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <div className="text-sm text-white/70">Critical alerts only</div>
              <div className="text-xs text-white/30">Mute medium and low severity notifications</div>
            </div>
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => setCriticalOnly(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <label className="mb-1.5 block text-xs font-medium text-white/50">Slack webhook URL (optional)</label>
        <input
          value={slackUrl}
          onChange={(e) => {
            setSlackUrl(e.target.value);
            setSlackError(null);
          }}
          placeholder="https://hooks.slack.com/services/..."
          className={`w-full rounded-lg border bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none ${
            slackError ? "border-rose-500/50" : "border-white/[0.1] focus:border-indigo-400/50"
          }`}
        />
        {slackError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" /> {slackError}
          </div>
        )}
      </GlassCard>

      <SaveButton status={status} errorMessage={errorMessage} onClick={handleSave} />
    </div>
  );
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-md border border-white/[0.1] bg-[#0b0d17] px-2 py-1 text-xs text-white focus:border-indigo-400/50 focus:outline-none disabled:opacity-50"
    >
      <option value="owner">Owner</option>
      <option value="admin">Admin</option>
      <option value="security_analyst">Security Analyst</option>
    </select>
  );
}

function TeamPanel() {
  const { user } = useAuth();
  const [members, setMembers] = useState(null);
  const [invitations, setInvitations] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("security_analyst");
  const [inviteError, setInviteError] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function loadAll() {
    const [m, i] = await Promise.all([listMembers(), listInvitations()]);
    setMembers(m);
    setInvitations(i);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError(null);
    if (!inviteEmail.includes("@")) {
      setInviteError("Enter a valid email address");
      return;
    }
    setInviting(true);
    try {
      await inviteMember(inviteEmail, inviteRole);
      setInviteEmail("");
      await loadAll();
    } catch (e) {
      setInviteError(e.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleResend(id) {
    await resendInvitation(id);
    await loadAll();
  }

  async function handleCancelInvite(id) {
    await cancelInvitation(id);
    await loadAll();
  }

  async function handleRemoveMember(id) {
    setActionError(null);
    try {
      await removeMember(id);
      await loadAll();
    } catch (e) {
      setActionError(e.message);
    }
  }

  async function handleRoleChange(id, role) {
    setActionError(null);
    try {
      await updateMemberRole(id, role);
      await loadAll();
    } catch (e) {
      setActionError(e.message);
    }
  }

  if (!members || !invitations) return <div className="text-sm text-white/30">Loading team...</div>;

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      {/* Invite form — creates a pending Invitation, never a Member directly
          (Session 8: "The User is only created at Accept time.") */}
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
          <UserPlus className="h-4 w-4 text-indigo-400" /> Invite a team member
        </div>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5">
              <Mail className="h-4 w-4 text-white/30" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                placeholder="colleague@company.com"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
            </div>
            {inviteError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" /> {inviteError}
              </div>
            )}
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg border border-white/[0.1] bg-[#0b0d17] px-3.5 py-2.5 text-sm text-white focus:border-indigo-400/50 focus:outline-none"
          >
            <option value="security_analyst">Security Analyst</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#07080f] transition hover:bg-white/90 disabled:opacity-60"
          >
            {inviting ? "Sending invite..." : "Send Invite"}
          </button>
        </form>
      </GlassCard>

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-3.5 py-2.5 text-xs text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {actionError}
        </div>
      )}

      {/* Pending invitations — not accounts yet, just trust objects */}
      {pendingInvitations.length > 0 && (
        <GlassCard className="overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 text-sm font-medium text-white">
            Pending Invitations <span className="text-white/30">({pendingInvitations.length})</span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-white/80">{inv.email}</div>
                    <div className="text-xs text-white/30">
                      Expires {new Date(inv.expires_at).toLocaleDateString()} · {inv.role.replace("_", " ")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="acknowledged">pending</Badge>
                  <button
                    onClick={() => handleResend(inv.id)}
                    className="flex items-center gap-1 rounded-md border border-white/[0.1] px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.05]"
                  >
                    <RotateCw className="h-3 w-3" /> Resend
                  </button>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label={`Cancel invitation for ${inv.email}`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Active members — real accounts with an active Membership */}
      <GlassCard className="overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4 text-sm font-medium text-white">
          Members <span className="text-white/30">({members.length})</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                  {m.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-white/80">
                    {m.name} {m.id === user?.id && <span className="text-white/30">(you)</span>}
                  </div>
                  <div className="text-xs text-white/30">{m.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="active">{m.status}</Badge>
                <RoleSelect
                  value={m.role}
                  disabled={m.role === "owner"}
                  onChange={(role) => handleRoleChange(m.id, role)}
                />
                {m.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <div>
      <Topbar icon={SettingsIcon} title="Settings" subtitle="Workspace, alert thresholds, notifications, and your team." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition ${
                activeTab === t.id
                  ? "bg-white/[0.07] text-white"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <Reveal key={activeTab}>
          {activeTab === "workspace" && <WorkspacePanel />}
          {activeTab === "alerts" && <AlertPolicyPanel />}
          {activeTab === "notifications" && <NotificationsPanel />}
          {activeTab === "team" && <TeamPanel />}
        </Reveal>
      </div>
    </div>
  );
}
