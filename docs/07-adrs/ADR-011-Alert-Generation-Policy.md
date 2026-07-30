---
title: ADR-011 - Alert Generation Policy
status: Accepted
date: 2026-07-24
---

# ADR-011

## Title

Alert Generation Policy

---

## Status

Accepted

---

## Context

The ML Engine determines the security assessment of an Observation.

However, whether a user should actually receive an alert depends on platform policies rather than ML predictions alone.

Future platform versions may allow organizations to configure custom alert thresholds.

---

## Decision

The ML Engine returns only Predictions.

The Backend evaluates those Predictions against platform policies and decides whether an Alert should be created.

---

## Consequences

### Positive

- Clear separation between analysis and business rules.
- Flexible alert policies.
- Easier future customization.

### Negative

- Alert generation introduces an additional Backend processing step.