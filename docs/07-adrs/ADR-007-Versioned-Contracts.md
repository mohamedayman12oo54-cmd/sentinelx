---
title: ADR-007 - Versioned Contracts
status: Accepted
date: 2026-07-24
---

# ADR-007

## Title

Versioned Contracts

---

## Status

Accepted

---

## Context

The SentinelX platform consists of multiple independently evolving components:

- SDK
- Backend
- ML Engine

Without explicit versioning, a change in one component could unintentionally break compatibility with another.

---

## Decision

Each public contract is independently versioned.

Versioning applies to:

- ASES Specification
- REST API
- ML Contract

Each contract evolves independently while preserving backward compatibility whenever possible.

---

## Consequences

### Positive

- Independent component evolution.
- Controlled upgrades.
- Reduced integration risk.
- Clear compatibility expectations.

### Negative

- Additional version management.
- Need for compatibility testing across versions.