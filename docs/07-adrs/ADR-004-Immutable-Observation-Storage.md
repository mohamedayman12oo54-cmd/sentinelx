---
title: ADR-004 - Immutable Observation Storage
status: Accepted
date: 2026-07-24
---

# ADR-004

## Title

Immutable Observation Storage

---

## Status

Accepted

---

## Context

Observations represent the original execution history of an AI Agent.

If Observations are modified after submission, the platform loses the ability to audit what actually happened.

This also makes future ML model improvements impossible because historical data would no longer be trustworthy.

---

## Decision

Once an Observation is accepted by the Backend, it becomes immutable.

Neither users nor internal services are allowed to modify its content.

Any later analysis is stored separately as a Prediction.

---

## Consequences

### Positive

- Preserves forensic integrity.
- Enables future model re-analysis.
- Simplifies auditing.
- Maintains historical consistency.

### Negative

- Incorrect Observations cannot be edited.
- Corrections require submitting a new Observation.