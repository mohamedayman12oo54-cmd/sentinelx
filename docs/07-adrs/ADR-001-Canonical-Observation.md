---
title: ADR-001 - Canonical Observation Schema
status: Accepted
date: 2026-07-24

---

# ADR-001

## Title

Canonical Observation Schema

---

## Status

Accepted

---

## Context

SentinelX receives execution data from different AI frameworks.

Each framework exposes logs in different formats.

Using framework-specific payloads would tightly couple the platform to external implementations.

---

## Decision

The platform adopts a single canonical Observation format named ASES.

Every SDK is responsible for converting native framework events into the ASES format before submission.

---

## Consequences

Positive

- Framework-independent.
- Stable ML input.
- Consistent Backend processing.

Negative

- SDK implementations require an event mapping layer.