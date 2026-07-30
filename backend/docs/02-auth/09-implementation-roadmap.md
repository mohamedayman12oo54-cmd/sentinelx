# 09 — Implementation Roadmap

> Source: the final session of the Authentication Design series — Implementation Roadmap.
> This session introduces no new concepts. It converts everything designed across the previous eight sessions into an actual build plan.

---

## 1. The Rule Behind This Session

> **We are not organizing files. We are organizing the construction process itself.**

And from the very start of the project, one rule has held:

> **Don't Code Until the Architecture Stops Changing.**

We have reached that point. This session does not discuss new ideas or change the design — it converts the design into implementation steps.

---

## 2. What Do We Build First?

Many start with a `Login API`. That's a mistake. We build from the bottom up.

### Phase 1 — Foundation Layer

Before any Authentication work, the core Domain must exist:

```text
Organization
    ↓
User
    ↓
Agent
    ↓
API Key
```

**Why?** Because everything after this depends on them. So the very first thing built is the **Models and Database** — not Login.

---

### Phase 2 — Identity Layer

Once the entities exist, we build the concept of **Identity** — not JWT, not Password.

The goal is to have a single object that represents:

```text
Authenticated Identity
```

This is what the entire system will interact with afterward.

---

### Phase 3 — Authentication Layer

Only now do we start building actual Authentication — and in order:

**Human Authentication**
```text
Register
    ↓
Email Verification
    ↓
Login
    ↓
JWT Generation
```

**Agent Authentication**
```text
Generate API Key
    ↓
Hash
    ↓
Verification
```

Each one is built as an independent module.

---

### Phase 4 — Authorization Layer

Once Authentication is functioning, we move to Authorization:

```text
Roles
    ↓
Permissions
    ↓
Authorization Service
```

...and then wire it into the Routes.

---

### Phase 5 — Security Layer

This covers everything discussed in [`07-security.md`](./07-security.md):

```text
Rate Limiting
    ↓
Audit Logging
    ↓
Error Handling
    ↓
Secrets
    ↓
Validation
```

Note: this is **cross-cutting** — it touches the entire project, not one isolated module.

---

### Phase 6 — API Layer

Once all internal services work correctly, we build the public APIs.

For Humans:
```text
POST /register
POST /login
POST /logout
GET  /me
```

For Agents:
```text
POST /observations
POST /api-keys/rotate
```
...and so on.

---

### Phase 7 — Testing

Many leave this for last. We treat it as **part of the implementation itself**.

**Authentication**
```text
✔ Valid Login
✔ Invalid Password
✔ Disabled User
✔ Expired JWT
✔ Invalid JWT
```

**API Key**
```text
✔ Valid Key
✔ Invalid Key
✔ Revoked Key
✔ Disabled Agent
```

**Authorization**
```text
✔ Allowed
✔ Forbidden
✔ Wrong Role
```

This is what gives us confidence in the system.

---

## 3. Do We Build All of This at Once?

**No** — one of the most important decisions of the whole project. We work **incrementally**.

```text
Sprint 1: Organizations, Users, Register, Login
Sprint 2: JWT, Authentication Middleware, /me
Sprint 3: Agents, API Keys, Observation Authentication
Sprint 4: Roles, Permissions, Authorization
Sprint 5: Audit Logs, Rate Limits, Security Hardening
```

Note: every Sprint produces a **working feature** — not just code sitting incomplete.

---

## 4. What Order Should Code Actually Be Written In?

```text
Database
    ↓
Models
    ↓
Repositories
    ↓
Services
    ↓
Authentication
    ↓
Authorization
    ↓
Controllers
    ↓
Routes
    ↓
Tests
```

Never the reverse.

---

## 5. When Do We Start the SDK?

An important question for this project. We start it **after** the Observation endpoint is stable — not before.

**Why?** The SDK is merely a Client. It cannot be sensibly built before the API it talks to has stabilized.

---

## 6. When Do We Wire In ML?

After the Backend can receive and store a complete Observation.

**Why?** Because this gives us a clear pipeline:

```text
Agent
    ↓
Backend
    ↓
Database
    ↓
ML
    ↓
Response
    ↓
Dashboard
```

And if something goes wrong, we know exactly where to look.

---

## 7. The Complete Phase Map

```text
Phase 1
Database
    ↓
Phase 2
Domain Models
    ↓
Phase 3
Identity Layer
    ↓
Phase 4
Authentication
    ↓
Phase 5
Authorization
    ↓
Phase 6
Security
    ↓
Phase 7
Public APIs
    ↓
Phase 8
SDK
    ↓
Phase 9
ML Integration
    ↓
Phase 10
Dashboard Integration
    ↓
Production Ready
```

---

## 8. The Central Mindset of This Session

We do not say:

> "We'll finish Authentication."

We say:

> "We'll build it layer upon layer."

This keeps every layer:

- Testable.
- Independent.
- Understandable.
- Easy to locate if a bug appears.

---

## 9. Full Summary

```text
Implementation Roadmap

Phase 1
Database
    ↓
Phase 2
Domain Models
    ↓
Phase 3
Identity Layer
    ↓
Phase 4
Authentication
    ↓
Human Authentication
Agent Authentication
    ↓
Phase 5
Authorization
    ↓
Roles
Permissions
    ↓
Phase 6
Security Hardening
    ↓
Audit Logs
Rate Limits
Validation
    ↓
Phase 7
Public APIs
    ↓
Phase 8
SDK
    ↓
Phase 9
ML Integration
    ↓
Phase 10
Dashboard Integration

────────────────────────

Development Principles
✔ Build from the Domain upward.
✔ One layer at a time.
✔ Every layer should be testable.
✔ Every Sprint should deliver a working feature.
✔ SDK starts after API stabilises.
✔ ML integration starts after Observation pipeline is complete.
```

---

## 10. Final Conclusion of the Authentication Design Series

The goal set at the very first session has been achieved: Authentication is no longer thought of as "Login and JWT" — it's treated as a complete architectural piece of the platform.

The final design reduces to this chain:

```text
Identity
    ↓
Credential
    ↓
Authentication
    ↓
Authenticated Identity
    ↓
Authorization
    ↓
Business Logic
    ↓
Audit
```

This will be one of the strongest parts of the project, precisely because it's built on stable concepts, not tied to any particular framework or library.
