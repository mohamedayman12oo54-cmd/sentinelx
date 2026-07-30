---
title: ADR-014 - Stable ML Contract
status: Accepted
date: 2026-07-24
---

# ADR-014

## Title

Stable ML Contract

---

## Status

Accepted

---

## Context

The Backend and the ML Engine are developed independently.

If the response format changes frequently, every update to the ML Engine would require coordinated Backend changes, increasing deployment risk.

---

## Decision

The communication contract between the Backend and the ML Engine is treated as a stable public interface.

Any incompatible change requires a new contract version rather than modifying the existing one.

---

## Consequences

### Positive

- Independent team development.
- Predictable integrations.
- Easier testing.
- Safer deployments.

### Negative

- Version management overhead.
- Temporary support for multiple contract versions.