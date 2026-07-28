# ADR-003: JWT Carries the Minimum Possible Set of Identifiers, Never Business Data

| | |
|---|---|
| **Status** | ✅ Accepted (Frozen) |
| **Session** | Session 4 — JWT Design |
| **Affects** | The JWT claim set, all middleware that decodes JWTs, and the shape of the "Authenticated Identity" object |

---

## Context

Once it was established that JWT is issued only to Human Identities and serves solely as proof that authentication already succeeded (see [`04-jwt.md`](../04-jwt.md)), the question became: exactly what data should live inside the token payload?

---

## Decision

The JWT contains **only**:

```text
Identity ID
Identity Type
Company ID
Issued At
Expires At
```

It explicitly and permanently **excludes**:

```text
Name
Email
Avatar
Permissions
Role Name
Company Name
```

The exact claim shape is specified in [`contracts/jwt-claims.md`](../contracts/jwt-claims.md).

---

## Rationale

### The JWT Is Not a Database
Its entire purpose (see [`04-jwt.md`](../04-jwt.md)) is to reduce the need to re-verify a password on every request — nothing more. Turning it into a mini-database of user attributes defeats that narrow purpose and introduces new failure modes.

### Mutable Data Inside an Immutable Token Is a Contradiction
A JWT, once issued, cannot be edited — only reissued or left to expire. If the Name, Email, Role, or Company Name changes after the token was issued, every already-issued token becomes silently stale. Should changing your display name invalidate every active session? Obviously not — which proves this data doesn't belong in the token at all.

### Permissions Specifically Must Never Be Embedded
This is reinforced directly by [`ADR-001-role-storage.md`](./ADR-001-role-storage.md): if Role (and by extension, Permissions) were embedded, a permission downgrade would not take effect until the token naturally expired — a real security hole on a security platform.

### Identifiers Are Stable; Business Data Is Not
`Identity ID` and `Company ID` are immutable references. Everything else about a person — their name, their role, their permissions — is mutable business state that belongs in the database, fetched fresh on demand.

---

## Rejected Alternatives

| Alternative | Reason for Rejection |
|-------------|------------------------|
| Include `role` in the claims for faster authorization checks | Creates the exact stale-permission window rejected in [`ADR-001-role-storage.md`](./ADR-001-role-storage.md) |
| Include `name` / `email` / `avatar` to avoid a user lookup on every "who am I" display | Turns the JWT into a cache of mutable profile data, which becomes stale the moment the user edits their profile |
| Include `company_name` for display convenience | Same staleness problem — company names can change; only `company_id` is a stable identifier |

---

## Consequences

- ✅ A token remains valid and correctly interpretable regardless of any profile, role, or company-name change that happens after it was issued.
- ✅ Every layer downstream of Authentication (Authorization, Business Logic) is forced to treat Role and Company as live, database-sourced facts — never as trusted-but-possibly-stale token claims.
- ✅ The token stays small, reducing header size on every request.
- ⚠️ Any endpoint that needs to *display* Name, Email, or Company Name (e.g., `GET /me`) must perform an explicit database lookup using the `Identity ID` from the token — it cannot read this data directly off the JWT.
