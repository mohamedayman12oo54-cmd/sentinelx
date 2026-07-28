# 04 — JWT Design

> Source: Session 4 — JWT Design
> This session only became possible after Identity (Session 2) and Authentication Flows (Session 3) were fully settled — this ordering is deliberate.

---

## 1. Is JWT Authentication?

**No** — and this must be established first.

JWT does not perform Authentication. Authentication has already happened. The JWT is merely **proof (Proof)** that authentication happened previously. This is a significant distinction.

### Revisiting the Flow

```text
Ahmed
    ↓
Email + Password
    ↓
Verify Password
    ↓
Authenticated
    ↓
Issue JWT
```

The JWT arrives **after** successful authentication — never before.

---

## 2. What Is JWT in This Project?

> **JWT is a temporary permit that allows a Human Identity to interact with the platform without re-entering their password on every request.**

Focus on the word **Temporary** — not Permanent.

---

## 3. Who Uses JWT?

Not every Identity.

```text
✔ Human Identity
✖ Agent
✖ Internal Service
```

This is a fixed decision.

---

## 4. Does JWT Represent a User?

**No** — a very precise point. The JWT represents an **Authenticated Identity**, not a `User`. This follows directly from the Session 3 decision that the Backend works with Identity, not User.

So when middleware decodes the JWT, it produces an **Authenticated Identity** — not a `User` model directly.

---

## 5. What Is the Real Purpose of JWT?

People often answer "Login." That's wrong. The real purpose is:

> **Reducing the need to re-verify the password on every single request.**

Instead of:

```text
Request → Password Check → Request → Password Check → Request → Password Check
```

We get:

```text
Login once → JWT → JWT Verification → JWT Verification → JWT Verification
```

That is the entire reason JWT exists.

---

## 6. What Should Be Inside the JWT?

A commonly mishandled question. There is exactly one rule:

> **The JWT carries the smallest possible amount of data.**

**Why?** Because the JWT is not a database.

### Minimum content:

```text
Identity ID
Identity Type
Company ID
Issued At
Expires At
```

That's it.

### Explicitly excluded:

```text
Name
Email
Avatar
Permissions
Role Name
Company Name
```

All of these are mutable business data.

**Why exclude them?** Imagine Ahmed changes his name — should every existing token become invalid? Certainly not.

So: the JWT carries **Identifiers**, not **Business Data**. See the exact contract in [`contracts/jwt-claims.md`](./contracts/jwt-claims.md) and the full reasoning in [`adr/ADR-003-jwt-claims.md`](./adr/ADR-003-jwt-claims.md).

---

## 7. Is JWT Responsible for Authorization?

**No** — an important point. It may carry the Identity ID, but **Authorization** is what determines "can this person perform this operation?" — never the JWT itself.

---

## 8. Do We Store JWT in the Database?

**No** — one of the most important JWT properties.

It is **Stateless**. The Backend never has to store it.

```text
Every Request
    ↓
Verify JWT validity.
    ↓
Continue.
```

---

## 9. What Happens on Logout?

The first point that may feel like a problem, since we don't store JWTs anywhere.

In the MVP, the simplest professional solution is chosen:

> **Logout deletes the token client-side only.**

**Why?** This fits Stateless Authentication perfectly.

If we later need:
```text
Token Revocation
Blacklist
Multi-device Session Management
```
those can be added in a later version. Right now, they would be over-engineering.

---

## 10. Should JWT Have a Long Lifetime?

**No.** It must be **Short-lived**.

If a JWT gets stolen, every extra minute it remains valid is extra risk.

We aren't pinning exact numbers here — we're establishing the principle:

> **Short-lived Access Tokens.**

---

## 11. What Happens After the JWT Reaches the Backend?

```text
Request
    ↓
Extract JWT
    ↓
Verify Signature
    ↓
Verify Expiration
    ↓
Build Authenticated Identity
    ↓
Authorization
    ↓
Business Logic
```

Note: not a single service in the system ever sees the raw JWT itself — every one of them only sees the **Authenticated Identity**. This is a direct extension of the Session 3 decision.

---

## 12. An Important Architectural Point

Look at the full chain:

```text
Password
    ↓
Authentication
    ↓
JWT
    ↓
Authenticated Identity
    ↓
Authorization
    ↓
Business Logic
```

The JWT is merely a **bridge**, not the hero of the story. The real hero is the **Authenticated Identity**.

---

## 13. Is JWT Part of the Domain?

**No** — a point worth firmly establishing. JWT is a technology, not a Business Concept.

If tomorrow we replace it with:
```text
PASETO
Session Cookies
Any other technology
```
The Domain remains completely unaffected. This proves the Business and Infrastructure layers were separated correctly.

---

## 14. Session 4 Summary

```text
JWT Design

Purpose
Provide temporary proof of successful authentication.

────────────────────────

Used By
✔ Human Identity
✖ Agent Identity
✖ Internal Services

────────────────────────

JWT Contains
✔ Identity ID
✔ Identity Type
✔ Company ID
✔ Issued At
✔ Expiration

────────────────────────

JWT Does NOT Contain
✖ User Profile
✖ Permissions
✖ Business Data

────────────────────────

Flow
Login
    ↓
Issue JWT
    ↓
Verify JWT
    ↓
Build Authenticated Identity
    ↓
Authorization
    ↓
Business Logic

────────────────────────

Rules
✔ JWT is not Authentication.
✔ JWT is Stateless.
✔ JWT is not stored in the database.
✔ JWT is short-lived.
✔ JWT is an infrastructure concern, not a business entity.
```

---

## 15. The Most Important Decision in This Session

> **JWT is not a way to access user data... it's a way to access a verified identity (Authenticated Identity).**

This means the rest of the system is completely isolated from JWT's internal details. If we ever decide to change the entire authentication mechanism, Controllers, Services, and Authorization never need to change, because they never depended on JWT to begin with — they depend only on **Authenticated Identity**. This is one of the decisions that keeps the architecture clean and evolvable without ever needing to rewrite large parts of the system.
