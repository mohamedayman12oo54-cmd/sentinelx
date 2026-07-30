---
title: ADR-008 - API-First Integration
status: Accepted
date: 2026-07-24
---

# ADR-008

## Title

API-First Integration

---

## Status

Accepted

---

## Context

AI Agents require a reliable and consistent integration point with SentinelX.

Allowing SDKs or Agents to communicate directly with internal services such as the ML Engine would tightly couple external clients to the platform's internal architecture.

---

## Decision

All external integrations communicate exclusively through the SentinelX REST API.

The Backend is the only component responsible for interacting with internal services, including the ML Engine.

---

## Consequences

### Positive

- Stable integration surface.
- Internal architecture remains hidden.
- Easier security enforcement.
- Independent evolution of internal services.

### Negative

- All external traffic passes through the Backend.