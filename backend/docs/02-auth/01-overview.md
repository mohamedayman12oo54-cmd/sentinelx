# 01 — Overview: Authentication Philosophy

> Source: Session 1 — Authentication Philosophy
> This file answers: **"What is authentication actually for in SentinelX?"** — not how it's implemented.

---

## 1. The Rule Behind This Entire Document Set

> **We are not learning Authentication. We are designing an Authentication system specific to our product.**

Nothing in this documentation is generic "how JWT works" material. Every decision below is a decision made specifically for SentinelX's shape: a multi-tenant security platform used by humans, AI agents, and internal services.

---

## 2. What Does "Authentication" Actually Mean?

Most people answer this question with: **"Login."** That answer is wrong.

Authentication means:

> **Proof of identity.**

That's it. An entity claims "I am Ahmed." The system says "prove it." If they prove it, they are **Authenticated**.

---

## 3. Authentication vs. Authorization

These two are constantly confused. The distinction is drawn as a hard line from Session 1 onward:

| Question | Layer |
|----------|-------|
| **Who are you?** | Authentication |
| **What are you allowed to do?** | Authorization |

These are two separate concerns, handled by two separate layers, and this separation is never violated anywhere in the system.

---

## 4. Who Needs Authentication?

Every Actor in the platform — but each one differently:

| Actor | Mechanism |
|-------|-----------|
| **Human** | Email + Password |
| **Agent** | API Key |
| **Internal Service** | Private Network or Service Secret (an internal concern between our own services, not part of any client-facing interface) |

This is why, from day one, the following principle was established:

> **No Universal Authentication Mechanism.**

This is a production-grade decision. Trying to force every actor through the same login flow would either cripple the Agent experience or weaken the Human experience — so instead, each actor gets the mechanism that actually fits its nature.

---

## 5. Is Authentication Responsible for Permissions?

**No.** This is one of the most important rules in the entire design.

If Ahmed logs in, all we know is that he is, in fact, Ahmed. We still don't know:
- Can he delete an Agent?
- Can he create an API Key?
- Can he view the Dashboard?

Those questions belong entirely to a later stage — Authorization (see [`06-authorization.md`](./06-authorization.md)).

---

## 6. Is Authentication Responsible for the User?

Also **no** — and this is a subtlety many designs miss.

Authentication is responsible for **proving identity**. But:
- Creating a User
- Updating a User
- Deleting a User

...are all **User Management** concerns, not Authentication concerns.

---

## 7. What Does Authentication Actually Hold Onto?

Exactly four things:

```text
Identity
    ↓
Credential
    ↓
Session
    ↓
Verification
```

| Concept | Meaning |
|---------|---------|
| **Identity** | Who are you? |
| **Credential** | Proof that you are who you claim to be |
| **Session** | Does the system still remember you? |
| **Verification** | Is this identity still valid? |

Nothing more.

---

## 8. Is Authentication Part of the Business Domain?

**No** — and this is a beautiful, load-bearing point.

If the entire business of SentinelX were to change tomorrow, Authentication would stay almost exactly as it is, because it is a **Cross-Cutting Concern**.

This means Authentication sits **before** the business, not inside it:

```text
Request
    ↓
Authentication
    ↓
Authorization
    ↓
Business Logic
```

Never:

```text
Business
    ↓
Authentication
```

This ordering shapes every piece of middleware built afterward.

---

## 9. The Most Important Decision in This Session

> **Our authentication is built around "Identity Types," not "User Types."**

We do not say:
```text
Admin
Employee
Viewer
```
Those are **Roles**, and they belong to Authorization (see [`06-authorization.md`](./06-authorization.md)).

We say:
```text
Human Identity
Agent Identity
Service Identity
```

This is a fundamentally different axis, because each type has:
- A different Credential.
- A different Lifecycle.
- A different verification method.
- A different trust level.

This is exactly the reason we separated JWT for humans from API Key for agents from the very beginning, instead of trying to force everything into one unified mechanism.

---

## 10. Session 1 Summary

```text
Authentication Philosophy

Authentication
    ↓
Verify Identity
NOT
Grant Permissions

────────────────────────

Identity Types
✔ Human
✔ Agent
✔ Internal Service

────────────────────────

Authentication Flow
Request
    ↓
Authentication
    ↓
Authorization
    ↓
Business Logic

────────────────────────

Authentication Owns
✔ Identity Verification
✔ Credentials
✔ Sessions
✔ Verification

────────────────────────

Authentication Does NOT Own
✖ Users
✖ Roles
✖ Permissions
✖ Business Logic
```

This philosophy makes the rest of the authentication documentation a natural extension of the broader architecture, rather than a separate, bolted-on subsystem. No over-engineering, no features added just because other projects have them — every decision here is directly tied to the story of the product.
