---
title: ADR-006 - Backend as Orchestrator
status: Accepted
date: 2026-07-24
---

# ADR-006

## Title

Backend as Orchestrator

---

## Status

Accepted

---

## Context

The Backend receives Observations, communicates with the ML Engine, stores data, and serves dashboard requests.

One option was to embed threat classification directly inside the Backend.

This would duplicate security logic and tightly couple business services with machine learning logic.

---

## Decision

The Backend acts solely as an orchestration layer.

Its responsibilities include:

- Authentication
- Validation
- Persistence
- ML communication
- Alert evaluation
- Dashboard APIs

Threat analysis remains the exclusive responsibility of the ML Engine.

---

## Consequences

### Positive

- Clear separation of responsibilities.
- Independent evolution of Backend and ML.
- Easier testing.
- Easier maintenance.

### Negative

- Platform availability depends on successful communication with the ML Engine.