# 01 — Overview: What the Integration Layer Is (and Is Not)

> This document answers the question that must be answered before any code is written: **what problem does this layer actually solve, for whom, and what does it deliberately refuse to do?**

---

## 1. The Naming Decision Behind This Whole Document Set

Throughout early design discussions, this component was called "the SDK." That name is intentionally avoided everywhere in this documentation, and the reason is not cosmetic.

Calling it "the SDK" invites thinking about *how to build a Python package* before answering *what problem it solves*. It also implicitly promises something untrue: that installing a package grants the ability to watch everything an arbitrary AI Agent does. That promise cannot be kept by any Python package, for any framework, ever — a package can only see what the code running around it chooses to expose.

For this reason, the component is named the **ASES Integration Layer**. It is a layer that sits between an AI Agent's execution framework and the SentinelX platform, and its only job is to move information faithfully and safely between the two.

---

## 2. The Test That Grounds Every Design Decision: "If We Deleted It"

If the Integration Layer did not exist, a customer wanting to send data to SentinelX would have to build, by hand, exactly the following list of things:

```text
Collecting individual execution events
Generating timestamps
Establishing event sequence/ordering
Validating the payload shape
Attaching metadata
Attaching the API Key
Retrying failed network calls
Compressing payloads
Handling schema versioning
```

Asking every customer to build all of that themselves would be an unacceptable burden — and an unreliable one, since every customer would build it slightly differently. That gap is precisely what this layer exists to close.

---

## 3. What This Layer Is Not

> **The ASES Integration Layer is NOT an Agent Monitoring System.**

This sentence is deliberately blunt, and it belongs on the very first page any engineer or customer reads. Treating this layer as a general-purpose monitor implies it must be able to observe *any* Agent, built with *any* framework, doing *anything*. That is not achievable, and pretending otherwise would produce an architecture built on a false premise.

---

## 4. What This Layer Actually Is

> **The ASES Integration Layer is an Observation Collector, Formatter, and Transporter.**

Exactly three responsibilities — no more:

### 4.1 Collect
The layer receives execution Events. It does not generate them. Events are produced by the Agent, the framework running it, or code the customer writes — never invented by this layer itself.

**Example:** CrewAI exposes callbacks. When a Tool runs, CrewAI itself calls something like `tool_started(...)`. The Integration Layer listens for that callback and turns it into an Event.

```text
CrewAI  →  Callback  →  ASES Adapter  →  Event
```

Never:

```text
CrewAI  →  ASES watching everything on its own   (this cannot happen)
```

### 4.2 Format
Every framework describes its own execution differently — CrewAI says *"Tool X Started,"* LangGraph says *"Node Executed,"* the OpenAI Agents SDK says *"Function Called."* This layer does not care about that diversity. It converts every one of them into the same shape:

```json
{
  "event_type": "...",
  "payload": { "..." : "..." }
}
```

This is called the **Canonical Event Model** — a single internal representation, regardless of source framework.

### 4.3 Transport
Once a complete Observation exists, the layer sends it. That's the entire job.

```text
Agent → Events → ASES Integration Layer → Observation → POST /observations
```

Never:

```text
Agent → Backend → Backend assembles the Observation itself   (wrong layer entirely)
```

---

## 5. Can This Layer Monitor Any Agent?

**No** — and accepting this honestly, before implementation, is one of the most consequential decisions in the entire project.

No Python package can reach inside an arbitrary Agent's execution and observe everything it does. What this layer requires instead is an **Integration Point** — a place the framework itself offers, such as a callback, a middleware hook, a decorator, or a wrapper. Full detail on exactly what this means and doesn't mean is in [`06-integration-point-concept.md`](./06-integration-point-concept.md).

This reframes the entire product honestly:

> **We do not watch the Agent. We receive the events that the Agent or its Framework allows us to see.**

---

## 6. What Does the Customer Actually Have to Do?

The measure of success for this layer is not how much it does — it's how little the customer has to do. If the customer already uses a supported framework (e.g., CrewAI), the entire integration is:

```python
from ases import monitor

monitor(...)
```

...wired to the framework's existing callback mechanism. The customer never:

- Modifies their Agent's logic.
- Writes their own logging.
- Builds any JSON by hand.

All of that is this layer's job, not theirs.

---

## 7. Does Every Framework Get an Adapter?

Yes, eventually — but not all at once.

```text
ASES Integration Layer
│
├── CrewAI Adapter
├── LangGraph Adapter
├── OpenAI Agents SDK Adapter
└── (more, over time)
```

V1 ships with **CrewAI only**, because it is the most widely used framework meeting our integration criteria (see [`07-agent-framework-ecosystem.md`](./07-agent-framework-ecosystem.md) for the full evaluation). Additional adapters are added afterward, one at a time, without changing anything else in the system — see [`ADR-005`](./adr/ADR-005-domain-driven-repository-structure.md) for why this is structurally guaranteed, not just a hope.

---

## 8. Summary

```text
Overview

The Layer IS
✔ An Observation Collector
✔ A Formatter (Canonical Event Model)
✔ A Transporter

The Layer Is NOT
✖ A universal Agent monitor
✖ A source of Events (it only receives them)
✖ Aware of any framework beyond its own Adapters

Core Principle
"We do not monitor the Agent. We standardize the events the Agent or
its Framework allows us to see, then transform them into a single
Observation and send it to SentinelX."
```

This reframing is what makes the rest of this layer's design achievable instead of aspirational — every document that follows builds directly on top of it.
