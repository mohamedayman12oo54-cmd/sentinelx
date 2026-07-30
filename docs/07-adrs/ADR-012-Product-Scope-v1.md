---
title: ADR-012 - Product Scope Version 1
status: Accepted
date: 2026-07-24
---

# ADR-012

## Title

Product Scope - Version 1

---

## Status

Accepted

---

## Context

During the design phase, two product directions were identified:

1. Behavioral Role Monitoring
2. Security Threat Detection

Behavioral Role Monitoring requires defining expected responsibilities for every Agent and detecting deviations from those responsibilities.

Security Threat Detection focuses on identifying dangerous actions regardless of the Agent's intended role.

Implementing both approaches simultaneously would significantly increase project complexity.

---

## Decision

SentinelX Version 1 focuses exclusively on Security Threat Detection.

All Agents are evaluated using the same security criteria.

Behavioral role monitoring is intentionally deferred to a future product version.

---

## Consequences

### Positive

- Smaller and more achievable MVP.
- Faster implementation.
- Strong architectural foundation for future expansion.
- Simplified ML pipeline.

### Negative

- Version 1 does not detect role violations that are otherwise non-malicious.