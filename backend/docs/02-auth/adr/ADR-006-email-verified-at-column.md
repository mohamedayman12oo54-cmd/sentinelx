# ADR-006: An Additive `users.email_verified_at` Column to Close the Email-Verification Gap

| | |
|---|---|
| **Status** | ✅ Accepted (Frozen) |
| **Session** | Authentication implementation, Phase 3 (Auth Foundation) |
| **Affects** | The existing `users` table (one new nullable column); [`03-authentication-flow.md`](../03-authentication-flow.md); [`02-domain.md`](../02-domain.md); [`contracts/auth-errors.md`](../contracts/auth-errors.md) |

---

## Context

The prior documentation-reconciliation pass (commit `41ea874`, "docs(auth): stop conflating DISABLED with unverified email") deliberately left email verification gating as an **open limitation**: `users.status` (`ACTIVE`/`DISABLED`) has no value capable of representing "registered but not yet verified" without overloading `DISABLED`'s sole, frozen meaning (administratively deactivated account). That pass explicitly declined to resolve the gap itself and required "a deliberate, approved schema decision... before implementation."

Implementation of Register/Login (this phase) cannot proceed without deciding this. The user has now approved adding the column.

---

## Decision

Add one nullable, additive column to the existing `users` table:

```text
users
──────────────────────
...(existing columns unchanged)...
email_verified_at      Timestamp, Nullable
...
```

- `NULL` → the account has not completed email verification.
- Non-`NULL` (set once, to the verification time) → the account is verified.

This column is orthogonal to `status`. It does not replace, alias, or interact with `ACTIVE`/`DISABLED` — a user can be `ACTIVE` and unverified (during the registration window), and, in principle, `DISABLED` regardless of verification state (an Owner can deactivate an account either way). The two-value `UserStatus` enum, [`state/human-identity-state.svg`](../diagrams/state/human-identity-state.svg), and every reconciliation made in commit `41ea874` remain unchanged and correct — this ADR does not reopen them.

### Why This Is Additive, Not a Reversal

Mirrors the precedent already set by [`ADR-005-invitations-table.md`](./ADR-005-invitations-table.md): a new, nullable, non-breaking column/table added on top of the frozen 7-entity schema to satisfy a real requirement the original 10-session database design predates, not a redesign of an existing decision. No existing column, constraint, or index is modified or removed.

### Login Gate

`03-authentication-flow.md` §3's "Human Authentication Flow" is now fully implementable as originally documented:

```text
Register → email_verified_at = NULL, status = ACTIVE
Verify Email (signed URL) → email_verified_at = now()
Login → rejected while email_verified_at IS NULL
```

The verification **mechanism** (a signed, expiring URL carrying the user's ID, validated by signature and expiry) is unchanged from what was already documented — this ADR gives it somewhere to persist its result.

---

## Rejected Alternatives

| Alternative | Reason for Rejection |
|---|---|
| Reinterpret `DISABLED` to also mean unverified | This is exactly what commit `41ea874` reverted — overloads one frozen enum value with two unrelated meanings and is itself a hidden architectural decision. |
| Add a third `UserStatus` value (e.g. `PENDING_VERIFICATION`) | Changes the meaning/cardinality of an already-frozen enum column that other logic (`DISABLED` checks, RBAC) depends on being exactly two-valued; a nullable timestamp is strictly additive, an enum value is not. |
| Stateless-only signed link, no persisted flag | Cannot answer "is this account currently verified?" outside the moment the link is clicked (e.g. on every login) — the flag is required to gate login at all. |

---

## Consequences

- ✅ `03-authentication-flow.md` §3's documented flow (`Register → Verify Email → Login`) is now fully implementable; the "Known limitation" notice there is superseded by this ADR and should be updated to reference it.
- ✅ `contracts/auth-errors.md`'s "Unverified email" row changes from "Not implementable" to a real, distinct failure case.
- ✅ No existing column, enum, constraint, or diagram is modified.
- ⚠️ `backend/docs/01-database/02-schema/entities.md` (`users` table) must be updated to list this column, since it is now part of the real, implemented schema — done alongside this ADR.
