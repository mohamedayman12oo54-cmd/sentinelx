---
title: ADR-009 - Framework Independence
status: Accepted
date: 2026-07-24
---

# ADR-009

## Title

Framework Independence

---

## Status

Accepted

---

## Context

SentinelX is designed to monitor AI Agents built with different frameworks.

Examples include:

- CrewAI
- LangGraph
- OpenAI Agents SDK
- AutoGen

Building framework-specific backend logic would significantly increase maintenance complexity and limit platform adoption.

---

## Decision

SentinelX remains framework-independent.

Every SDK is responsible for translating framework-specific execution details into the standard ASES Observation format before transmission.

The Backend and ML Engine operate only on canonical ASES Observations.

---

## Consequences

### Positive

- Broad framework compatibility.
- Simplified Backend.
- Unified ML pipeline.
- Easier onboarding of new frameworks.

### Negative

- SDK maintainers must implement framework-specific adapters.