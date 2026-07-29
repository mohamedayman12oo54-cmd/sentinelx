# ADR-002: API Key as a Long-Lived, Hashed, Single-Active Credential for Agents

| | |
|---|---|
| **Status** | ✅ Accepted (Frozen) |
| **Session** | Session 5 — API Key Design |
| **Affects** | The API Key credential model, the SDK's authentication contract, and Agent request authentication |

---

## Context

Agents run continuously (24/7), sending potentially thousands of requests without any human interaction. A credential mechanism was needed for Agents that fits this always-on, non-interactive nature — as opposed to JWT, which fits the Human login/session pattern.

---

## Decision

Agents authenticate using an **API Key**: a long-lived credential, generated once, displayed to the user exactly once, and stored in the database only as a hash — never in raw form.

```text
Generate → Display Once → Hash & Store → Use on every request → Rotate / Revoke
```

The SDK is only ever configured with the API Key and the API URL — nothing else (no Company ID, no Agent ID).

---

## Rationale

### Why a Credential Distinct From JWT?
A Human's usage pattern (`Login once → JWT → many requests`) is fundamentally different from an Agent's (`Every request → API Key verification`, with no session at all — the Agent is stateless). Forcing Agents through a JWT-issuing login flow would require simulating a "session" for an entity that has none.

### Why Hash-Only Storage?
Exactly the same reasoning as password storage: if the database is ever leaked, an attacker holding only hashes cannot reconstruct usable keys. The rule established is:

> **API Keys are treated exactly like Passwords.**

### Why Display the Raw Key Exactly Once?
This mirrors the industry-standard pattern used by GitHub, Stripe, and similar platforms. Since the raw key is never stored, it can never be shown again after creation — if lost, the only remedy is generating a new one.

### Why One Active Key Per Agent (in V1)?
Two schools of thought were considered — a single key per Agent, or support for multiple concurrent keys (to enable Blue/Green rotation or multi-environment setups). For the MVP, a single key per Agent was chosen because it is simpler, clearer, and avoids adding complexity to the SDK. Multiple keys remain a natural, non-breaking future addition.

### Why Does the SDK Never Send Company ID or Agent ID?
The API Key alone resolves both `Agent` and `Company` server-side. This keeps the SDK's configuration surface to exactly one secret value, and — just as importantly — keeps Company/Agent resolution as a server-derived fact rather than client-supplied data that could be forged or simply wrong.

---

## Rejected Alternatives

| Alternative | Reason for Rejection |
|-------------|------------------------|
| Issue JWTs to Agents, like Humans | Forces a login/session concept onto an entity that is inherently stateless and credential-stable — mismatched to the Agent's actual usage pattern |
| Store the raw API Key in the database (even encrypted, not hashed) | Unacceptable risk — a database leak combined with a recoverable encryption key would expose live credentials |
| Support multiple concurrent Active keys per Agent from day one | Adds SDK and rotation-logic complexity with no immediate MVP need — deferred to a future version |
| Auto-expire API Keys after a fixed time | Doesn't fit the Agent's always-on nature; expiration is instead handled explicitly via Rotate/Revoke/Agent Archived |

---

## Consequences

- ✅ Agent authentication requires zero session state on the Backend — fully stateless, consistent with the Agent's nature.
- ✅ A database leak alone cannot be used to impersonate an Agent (hash-only storage).
- ✅ The SDK stays minimal — one secret value to configure, nothing more.
- ✅ Key rotation is possible with zero downtime, since old keys are retained as `REVOKED` records rather than being destroyed (see the database ADR on API Key design for the underlying table structure).
- ⚠️ The "only one Active key" rule is enforced at the application layer, not by a database constraint — this must be respected explicitly in the key-creation code path.
