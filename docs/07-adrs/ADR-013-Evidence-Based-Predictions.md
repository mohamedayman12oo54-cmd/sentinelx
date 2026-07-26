---
title: ADR-013 - Evidence-Based Predictions
status: Accepted
date: 2026-07-24
---

# ADR-013

## Title

Evidence-Based Predictions

---

## Status

Accepted

---

## Context

A prediction consisting only of a verdict and a risk score does not provide enough information for users to understand why an Observation was classified as suspicious or malicious.

Without supporting evidence, users cannot investigate incidents effectively or build trust in the ML Engine's decisions.

---

## Decision

Every Prediction returned by the ML Engine must include structured evidence explaining the reasoning behind the security assessment.

Evidence may include:

- Matching events
- Detection models
- Threat categories
- Confidence scores
- Relevant references

---

## Consequences

### Positive

- Explainable security decisions.
- Easier incident investigation.
- Increased user trust.
- Better dashboard experience.

### Negative

- Larger Prediction payloads.
- Additional processing inside the ML Engine.