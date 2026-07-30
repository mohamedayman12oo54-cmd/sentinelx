---
title: ADR-003 - ML Responsibility Boundary
status: Accepted
date: 2026-07-24
---

# ADR-003

## Title

ML Responsibility Boundary

---

## Context

Security classification could be partially implemented inside the SDK or Backend.

Doing so would duplicate security logic across multiple components.

---

## Decision

Threat classification, evidence generation, and risk scoring are responsibilities of the ML Engine only.

The Backend stores and orchestrates data but does not classify threats.

---

## Consequences

Positive

- Single source of truth.
- Easier model evolution.
- Simpler Backend.

Negative

- Every Prediction depends on ML availability.