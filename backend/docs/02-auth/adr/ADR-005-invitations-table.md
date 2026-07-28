# ADR-005: An Additive `invitations` Table, Not a Reversal of the Frozen 7-Entity Schema

| | |
|---|---|
| **Status** | ✅ Accepted (Frozen) |
| **Session** | Reconciliation pass — Authentication documentation vs. Database documentation |
| **Affects** | A new `invitations` table; [`ADR-004-invitation-based-onboarding.md`](./ADR-004-invitation-based-onboarding.md); the auth-domain ERD |

---

## Context

[`ADR-004`](./ADR-004-invitation-based-onboarding.md) makes invitation-based onboarding — with `Pending → Accepted / Expired / Cancelled` lifecycle, plus Cancel, Resend, and a full audit trail — the only way team members join an Organization. That lifecycle needs persisted state: a stateless, signed-link-only approach (the same mechanism this reconciliation pass adopted for email verification, see [`02-domain.md`](../02-domain.md#9-does-identity-have-state)) cannot support server-side cancellation, resend, or a queryable list of pending invitations, because there is no row to update or list.

At the same time, `backend/docs/01-database/README.md` states the schema is **Frozen** at exactly 7 entities (`companies`, `users`, `agents`, `api_keys`, `observations`, `predictions`, `alerts`), and that any change requires "a new Business Requirement... not just a rethink." No `invitations` table exists anywhere in that documentation.

This ADR resolves the conflict: it does not touch a single existing table, column, or relationship in the frozen schema — it specifies one new, additive table.

---

## Decision

Add an 8th table, `invitations`, following every naming and design convention already established by `backend/docs/01-database/01-architecture/naming-conventions.md` and `design-principles.md`.

### Shape

```text
invitations
──────────────────────────
id (UUID v7)                PK
company_id                   FK → companies.id, ON DELETE RESTRICT
email                         String
role                           Enum: OWNER | MEMBER
invited_by_user_id               FK → users.id, ON DELETE RESTRICT
token_hash                        String, UNIQUE
status                              Enum: PENDING | ACCEPTED | EXPIRED | CANCELLED
expires_at                           Timestamp
accepted_at                           Timestamp, Nullable
created_at                             Timestamp
updated_at                              Timestamp
```

### Column Rationale

| Column | Why |
|--------|-----|
| `id` | UUID v7, matching [`adr-001-uuid-strategy.md`](../../01-database/03-decisions/adr-001-uuid-strategy.md) — applied without exception across every table, existing or new. |
| `company_id` | FK to `companies.id`, `RESTRICT` — matching the universal delete policy in [`relationships.md`](../../01-database/02-schema/relationships.md#4-سياسة-الحذف-delete-strategy). No `CASCADE`, no `SET NULL`, exactly like every other foreign key in the schema. |
| `email` | The invitee's email — plain string, not a foreign key, since no `User` row exists yet (see ADR-004's rejection of "ghost users"). |
| `role` | Reuses the exact `UserRole` domain (`OWNER`/`MEMBER` — see the reconciliation in [`06-authorization.md`](../06-authorization.md#7-what-are-our-roles)), since this value becomes `users.role` verbatim on acceptance. |
| `invited_by_user_id` | FK to `users.id`, `RESTRICT` — named to end in `_id` per the naming convention, prefixed for clarity since the table has no other `user`-referencing column to disambiguate from. |
| `token_hash` | The invitation-acceptance link is a **credential**, exactly like a password or an API Key. Per [`adr-004-api-key-strategy.md`](../../01-database/03-decisions/adr-004-api-key-strategy.md)'s established rule — "hash it, never store it raw" — only the hash of the invitation token is persisted; the raw token exists only in the emailed link. `UNIQUE`, mirroring `api_keys.key_hash`. |
| `status` | `PENDING \| ACCEPTED \| EXPIRED \| CANCELLED`, UPPERCASE string enum, matching the platform-wide enum convention (see [`enums.md`](../../01-database/02-schema/enums.md)) and the already-published [`state/invitation-state.svg`](../diagrams/state/invitation-state.svg) diagram — unchanged by this ADR. |
| `expires_at` | Ends in `_at`, per convention. Required — every invitation must have an expiry. |
| `accepted_at` | Ends in `_at`, nullable — populated only when `status` transitions to `ACCEPTED`, exactly like `alerts.acknowledged_at` / `alerts.resolved_at`. |
| `created_at` / `updated_at` | Present on every table without exception, per [`naming-conventions.md`](../../01-database/01-architecture/naming-conventions.md#5-الطوابع-الزمنية-timestamps). |

### Constraints

```text
PRIMARY KEY (id)
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
UNIQUE (token_hash)
CHECK (role IN ('OWNER', 'MEMBER'))
CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'))
NOT NULL: company_id, email, role, invited_by_user_id, token_hash, status, expires_at
```

The two `CHECK` constraints mirror exactly how the existing schema enforces enum membership at the database level for `alerts.severity` / `alerts.status` (see [`constraints.md`](../../01-database/02-schema/constraints.md)) — not a new pattern.

### Indexes

```text
INDEX (company_id, status)   -- serves "list this company's pending invitations" (Dashboard)
```

No index on `token_hash` beyond its `UNIQUE` constraint (which already provides one) — following [`indexes.md`](../../01-database/02-schema/indexes.md)'s rule that every index must pay for itself with a real query.

### Business Rule (Application Layer, Not a Database Constraint)

> At most one `PENDING` invitation per `(company_id, email)` at a time.

This is deliberately **not** a database `UNIQUE(company_id, email)` constraint, for the same reason `api_keys` has no such constraint on `(agent_id)` for `ACTIVE` status: old `CANCELLED`/`EXPIRED` invitations for the same email must be retained for audit, so the table legitimately holds multiple rows per `(company_id, email)` over time. The application enforces the single-`PENDING`-at-a-time rule when creating a new invitation — the exact same pattern as the API Key "one `ACTIVE` key per Agent" rule in [`adr-004-api-key-strategy.md`](../../01-database/03-decisions/adr-004-api-key-strategy.md).

---

## Rationale

### Why Additive, Not a Modification
The frozen schema's exclusion list (`backend/docs/01-database/README.md` §8) enumerates specific rejected ideas — Event Table, Roles Table, Permissions Table, Audit Logs Table, API Key Scopes, Webhooks, Soft Deletes, Partitioning, Event Sourcing, CQRS, Full Text Search, JSON Indexing, Read Replicas, Materialized Views. An `invitations` table is not on that list — it was never considered and rejected, only never considered, because the Authentication design (which requires it) postdates the Database design. Adding it does not reverse any existing decision.

### Why Not Fold Invitations Into `users`
This was the first alternative ADR-004 itself already rejected: creating a `users` row at invite time leaves an inactive, password-less "ghost" record for every invitation that expires or is cancelled, and complicates the `email` uniqueness constraint. Nothing about this reconciliation changes that reasoning.

### Why Not a Stateless, Unpersisted Token Instead
Considered as the zero-schema-change option (and the one actually used for email verification in this same reconciliation pass). Rejected specifically for invitations because ADR-004 requires **Cancel**, **Resend**, and a **queryable, auditable trail** of every invitation ever issued — none of which a stateless signed link can provide, since there is no server-side record to cancel, resend, or list. Email verification has no equivalent requirement (no "list pending verifications" dashboard, no cancel/resend distinct from "send another one"), which is why that case was resolved without a new table and this one could not be.

---

## Rejected Alternatives

| Alternative | Reason for Rejection |
|-------------|------------------------|
| Fold invitations into the `users` table (nullable `password_hash`, a `PENDING_INVITE` status) | Already rejected by ADR-004 itself; reintroduces the "ghost user" problem and weakens `NOT NULL password_hash`. |
| Stateless signed-link token, no table | Cannot support Cancel, Resend, or an auditable list of invitations — a real capability loss, not a wording fix. |
| Store the raw invitation token in the database | Rejected for the same reason raw API Keys and passwords are never stored — see [`adr-004-api-key-strategy.md`](../../01-database/03-decisions/adr-004-api-key-strategy.md). |
| `UNIQUE(company_id, email)` database constraint | Would prevent retaining historical `CANCELLED`/`EXPIRED` invitations for audit, exactly as an equivalent constraint would break API Key rotation history. |

---

## Consequences

- ✅ ADR-004's full invitation lifecycle (including Cancel, Resend, and audit trail) is preserved exactly as originally designed.
- ✅ None of the 7 frozen entities, their columns, or their relationships are modified.
- ✅ The new table follows every existing naming, typing, constraint, and indexing convention — it would not look out of place if it had been part of the original 10-session database design.
- ⚠️ **This table is not yet reflected in `backend/docs/01-database/`.** Per this reconciliation task's explicit instruction, that documentation is never modified here. A future, dedicated database-documentation update (adding `invitations` to `02-schema/entities.md`, `02-schema/relationships.md`, `02-schema/constraints.md`, `02-schema/indexes.md`, `05-implementation/migration-order.md` as step 8, and revising the "7 Entities" count in the README) is required before implementation begins, and is explicitly out of scope for this pass.
- ⚠️ Like the API Key single-`ACTIVE`-per-Agent rule, the single-`PENDING`-invitation-per-email rule is enforced at the application layer only, not by a database constraint.
