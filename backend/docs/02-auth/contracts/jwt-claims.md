# Contract: JWT Claims

> This is an implementation-ready specification, derived directly from [`04-jwt.md`](../04-jwt.md) and [`adr/ADR-003-jwt-claims.md`](../adr/ADR-003-jwt-claims.md). Anything not listed here must **not** be added to the token without a new ADR.

---

## 1. Scope

This contract applies only to **Human Identity** JWTs. Agents and Internal Services do not use JWTs (see [`04-jwt.md`](../04-jwt.md)).

---

## 2. Claim Set

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | String (UUID) | ✅ | The Identity ID — the Human's unique identifier |
| `identity_type` | String (Enum) | ✅ | Always `"HUMAN"` for this token type |
| `company_id` | String (UUID) | ✅ | The Company this Identity belongs to |
| `iat` | Integer (Unix timestamp) | ✅ | Issued At — when the token was created |
| `exp` | Integer (Unix timestamp) | ✅ | Expires At — must reflect a short-lived lifetime (see [`04-jwt.md`](../04-jwt.md#10-should-jwt-have-a-long-lifetime)) |

### Example Payload

```json
{
  "sub": "018f1e2a-7c3b-7c3e-9c3e-1a2b3c4d5e6f",
  "identity_type": "HUMAN",
  "company_id": "018f1e2a-1111-7c3e-9c3e-1a2b3c4d5e6f",
  "iat": 1753660800,
  "exp": 1753664400
}
```

---

## 3. Explicitly Forbidden Claims

The following must **never** appear in the JWT payload, under any circumstance, per [`adr/ADR-003-jwt-claims.md`](../adr/ADR-003-jwt-claims.md):

```text
name
email
avatar
permissions
role
role_name
company_name
```

If a future requirement seems to need one of these embedded, that requirement must be resolved via a new ADR that explicitly supersedes ADR-003 — not by quietly adding a field.

---

## 4. Verification Steps (Middleware Contract)

Every request carrying a JWT must be processed through exactly this sequence (see [`04-jwt.md`](../04-jwt.md#11-what-happens-after-the-jwt-reaches-the-backend)):

```text
1. Extract JWT from the Authorization header (Bearer scheme)
2. Verify signature
3. Verify expiration (exp)
4. Build an Authenticated Identity object from { sub, identity_type, company_id }
5. Pass the Authenticated Identity forward — never the raw token
```

If any step fails, the request must stop immediately, per the Fail-Securely principle in [`07-security.md`](../07-security.md) — see [`auth-errors.md`](./auth-errors.md) for the exact error response.

---

## 5. The Authenticated Identity Object (Derived, Not a Claim)

The object built from the verified JWT, and passed to every downstream layer, has this shape:

```text
AuthenticatedIdentity {
  id: string          // from sub
  type: "HUMAN"        // from identity_type
  company_id: string    // from company_id
}
```

Role, Name, Email, and any other profile or permission data are **never** part of this object at the Authentication stage — they are fetched separately by Authorization ([`06-authorization.md`](../06-authorization.md)) or by profile endpoints (e.g. `GET /me`) as needed.

---

## 6. Storage & Transport

- The JWT is **never** stored server-side (Stateless — see [`04-jwt.md`](../04-jwt.md#8-do-we-store-jwt-in-the-database)).
- Transported via the standard `Authorization: Bearer <token>` header.
- Logout removes the token client-side only in V1 — no server-side blacklist exists yet (see [`04-jwt.md`](../04-jwt.md#9-what-happens-on-logout)).
