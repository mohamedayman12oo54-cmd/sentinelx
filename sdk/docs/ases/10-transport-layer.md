# 10 — Transport Layer

> Source concept: Session 7. Any SDK can build a JSON payload. Very few know how to send it correctly, without ever becoming the reason a customer's Agent breaks. This document is what separates "Production" from "Demo."

---

## 1. Is the SDK's Job to Send an HTTP Request?

**No — and this is a deliberately surprising starting point.**

> **The SDK's job is to ensure the Observation reaches SentinelX safely, without affecting the Agent's execution.**

Notice the difference from *"Send Request."* Consider the failure scenario this framing is built to survive:

```text
Agent finishes a Task.
    ↓
Builder constructs the Observation.
    ↓
Transport sends the Request.
    ↓
Network Timeout.
```

Throwing an exception here would break the customer's Agent because of a SentinelX network hiccup — completely unacceptable. This produces the single most important rule in this entire document:

> **ASES must never be the reason an Agent fails.**

---

## 2. Passive by Design

Transport must be **Passive** — even if the SentinelX backend goes down entirely, the Agent must keep running unaffected. This is a Production-grade requirement, not a nice-to-have.

---

## 3. Does the Agent Wait for the Request to Finish?

**No.** If the API takes 500ms to respond, every single Task the Agent runs would be delayed by that amount — unacceptable. Transport must therefore be **asynchronous**:

```text
Observation Ready
    ↓
Queue
    ↓
Agent continues its own work
    ↓
Transport sends in the background
```

The Agent's own execution finishes *before* the HTTP call even happens — a deliberately elegant outcome.

---

## 4. What Kind of Queue?

Not RabbitMQ. Not Kafka.

> **An in-memory queue.**

The SDK lives inside a single process — it is not a distributed system, and reaching for distributed-systems infrastructure here would be over-engineering solving a problem that doesn't exist at this scale.

---

## 5. The Transport Lifecycle

```text
Observation
    ↓
Enqueue
    ↓
Worker
    ↓
HTTP Request
    ↓
Success → Delete
Failure → Retry
```

### Retry Policy

The retry count is deliberately **not** exposed as a customer-configurable setting — it's an internal implementation detail. The adopted policy: **3 retries, then drop** — logged as a warning, never raised as an exception.

### If the Network Disconnects Entirely
The Observation simply remains in the Queue. Once connectivity returns, the Worker resumes automatically — expected, normal behavior, nothing special required.

### If the SDK Is Shutting Down
Before shutdown completes, Transport performs a **Flush** — a best-effort attempt to send whatever remains queued, bounded by a short timeout. If it can't finish in time, it simply stops; a lost final Observation on shutdown is an accepted, bounded tradeoff, not a defect.

### Should the Queue Persist to Disk?

**Not in V1.** This follows directly from the Observation Lifecycle decision (see [`09-observation-lifecycle.md`](./09-observation-lifecycle.md)) that an Observation's life is measured in seconds. If the process crashes, the Agent itself has crashed — losing the last in-flight Observation in that scenario is acceptable for V1.

---

## 6. Who Knows What, Inside Transport

```text
Does Transport know the API Key?          Yes — via Configuration, never from
                                              the Builder, Adapter, or Collector.
Who performs Serialization?                 Transport — not the Builder.
Who knows the Endpoint?                       Transport only.
Who knows Authentication?                       Transport only.
Who knows the Retry policy?                       Transport only.
```

### Why Serialization Belongs to Transport, Not the Builder

The Builder constructs an in-memory object; **Transport** is what knows it's specifically talking HTTP, and therefore Transport is what turns that object into JSON. If a future version sends data over gRPC instead of HTTP, the Builder changes **zero lines** — only Transport's Serializer would need to change. This clean separation is exactly what makes such a future change cheap instead of invasive.

---

## 7. Transport's Own Internal Shape

Transport itself is not a monolith — it decomposes into four focused pieces:

```text
Queue        — holds Observations awaiting delivery.
Worker         — a background loop that pulls from the Queue.
Serializer       — converts an Observation object into JSON.
API Client         — the only thing that actually knows how to speak HTTP:
                       authentication, requests, retry policy, endpoint management.
```

The Worker itself does not send anything — it delegates to the API Client. This decomposition means a future switch to a different transport mechanism (e.g., a message broker) only touches the API Client and/or Serializer, never the Queue or Worker.

---

## 8. The Full Transport Picture

```text
Builder
    ↓
Observation Object
    ↓
Transport Queue
    ↓
Background Worker
    ↓
Serializer
    ↓
HTTP Client
    ↓
SentinelX API
```

Note: the Builder never sees JSON, HTTP, or the API — a deliberate and valuable ignorance.

---

## 9. Where Does SDK Responsibility End?

> **Does the SDK ever learn whether ML returned a Prediction? No.**

The SDK's responsibility ends the moment SentinelX responds `202 Accepted`. Everything that happens afterward — analysis, prediction, alerting — happens entirely inside the server, and is none of the client's concern. This is exactly what keeps the Client and Backend cleanly decoupled — full detail on this boundary is in [`ADR-005-sdk-responsibility-boundary.md`](./adr/ADR-005-sdk-responsibility-boundary.md).

---

## 10. The Complete Picture of the Whole Layer

```text
Framework
    │
    ▼
Adapter
    │
    ▼
Event Pipeline
    │
    ▼
Observation Collector
    │
    ▼
Observation Builder
    │
    ▼
Observation Validator
    │
    ▼
Transport Queue
    │
    ▼
Background Worker
    │
    ▼
Serializer
    │
    ▼
API Client
    │
    ▼
SentinelX REST API
```

This is, at this stage of the design, the first point where the full architecture becomes something that can genuinely be visualized directly as code.

---

## 11. Summary

```text
Transport Layer

Goal
Deliver observations to SentinelX without affecting Agent execution.

────────────────────────

Principles
- Never block the Agent.
- Never crash the Agent.
- Retry internally.
- Fail gracefully.

────────────────────────

Pipeline
Observation → Queue → Background Worker → Serializer → API Client
→ SentinelX REST API

────────────────────────

Queue
- In-memory
- FIFO
- Lightweight
- No external dependencies

────────────────────────

Worker
- Background process
- Pulls observations from the queue
- Invokes the API Client

────────────────────────

Serializer
- Converts Observation objects into JSON
- Independent from the Builder

────────────────────────

API Client
Responsibilities:
- Authentication
- HTTP Requests
- Retry Policy
- Endpoint Management

────────────────────────

Retry Policy
- 3 retries
- Log warning
- Drop observation

────────────────────────

Shutdown
Flush queue with a short timeout.

────────────────────────

SDK Responsibility Ends
After SentinelX accepts the observation (HTTP 202 Accepted).
```
