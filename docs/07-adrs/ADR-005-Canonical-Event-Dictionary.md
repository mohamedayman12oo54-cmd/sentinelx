---
title: ADR-005 - Canonical Event Dictionary
status: Accepted
date: 2026-07-24
---

# ADR-005

## Title

Canonical Event Dictionary

---

## Status

Accepted

---

## Context

Different AI frameworks emit different event names for equivalent actions.

For example, one framework may emit:

- http_request

while another emits:

- api_call

and another emits:

- llm_request

Allowing framework-specific event names would increase complexity across the SDK, Backend, and ML Engine.

---

## Decision

SentinelX defines an official Event Dictionary.

Every SDK maps framework-specific events into these canonical event types before sending Observations.

The Event Dictionary represents the common language shared by the entire platform.

---

## Consequences

### Positive

- Consistent Observations.
- Simplified ML processing.
- Easier SDK maintenance.
- Framework independence.

### Negative

- SDK implementations require an event mapping layer.