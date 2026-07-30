---
title: ADR-010 - SDK Responsibilities
status: Accepted
date: 2026-07-24
---

# ADR-010

## Title

SDK Responsibilities

---

## Status

Accepted

---

## Context

The SentinelX SDK is embedded inside customer AI Agents.

Without clearly defining its responsibilities, security logic could become fragmented between the SDK, Backend, and ML Engine.

---

## Decision

The SDK is responsible only for:

- Capturing execution events.
- Building ASES-compliant Observations.
- Authenticating with the Backend.
- Transmitting Observations reliably.

The SDK must not perform:

- Threat detection.
- Risk scoring.
- Threat classification.
- Alert generation.
- Security decisions.

---

## Consequences

### Positive

- Lightweight SDK.
- Consistent security logic.
- Easier maintenance.
- Independent SDK evolution.

### Negative

- Every Observation requires Backend communication before analysis.