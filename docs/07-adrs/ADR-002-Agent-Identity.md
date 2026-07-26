---
title: ADR-002 - Agent Identity Resolution
status: Accepted
date: 2026-07-24
---

# ADR-002

## Title

Agent Identity Resolution

---

## Context

Observations must be associated with the correct Organization and Agent.

Embedding identity fields inside every Observation increases payload size and allows clients to spoof identities.

---

## Decision

Agent identity is resolved exclusively through the authenticated Agent API Key.

The Observation payload never includes Organization ID or Agent ID.

---

## Consequences

Positive

- Smaller payloads.
- Simpler SDK.
- Stronger security.
- Centralized identity management.

Negative

- API authentication becomes mandatory.