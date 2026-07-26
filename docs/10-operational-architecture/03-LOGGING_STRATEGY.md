---
title: Logging Strategy
category: Operational Architecture
status: Approved
version: 1.0

depends_on:
  - ASES_SPECIFICATION.md
  - EVENT_DICTIONARY.md

related_documents:
  - OBSERVATIONS_API.md
---

# Logging Strategy

## Purpose

This document defines the logging philosophy adopted by SentinelX.

---

# Design Principles

- Structured logging only.
- JSON-based observations.
- Immutable execution records.
- Framework-independent event model.

---

# Canonical Observation

SentinelX adopts the ASES Observation Schema as the canonical representation of AI Agent execution.

All supported SDKs normalize framework-specific events into the ASES schema before transmission.

---

# Event Classification

Events are classified using the ASES Event Dictionary.

The SDK is responsible for normalization, while the ML Engine interprets event semantics.

---

# Logging Objectives

- Security analysis
- Incident investigation
- Historical auditing
- ML inference
- Future re-analysis using newer ML models