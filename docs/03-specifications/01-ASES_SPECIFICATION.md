---
title: ASES Specification
category: Specification
status: Frozen
version: 1.0
owner: SentinelX Team

depends_on:
  - BUSINESS_FLOW.md

related_documents:
  - EVENT_DICTIONARY.md
  - ASES_JSON_SCHEMA.md
  - ML_CONTRACT.md

related_diagrams:
  - Observation Flow Diagram
---

# ASES Specification

## Overview

ASES (Agent Security Event Specification) is the official event specification used by SentinelX.

It defines the common language used by AI Agents, the SentinelX Backend, and the Machine Learning Engine when exchanging execution observations.

Every Observation submitted to SentinelX must comply with this specification.

---

# Purpose

ASES exists to standardize how AI Agent execution behavior is represented.

Instead of sending framework-specific logs, every Agent produces the same canonical Observation format.

This guarantees consistent processing regardless of the underlying AI framework.

---

# Design Goals

ASES is designed to be:

- Framework independent
- Human readable
- Machine processable
- Extensible
- Versioned
- Backward compatible whenever possible

---

# Observation Model

An Observation represents a single completed execution performed by an AI Agent.

Each Observation contains:

- Execution context
- Ordered execution events
- Metadata

An Observation is immutable once submitted.

---

# Event Model

An Observation is composed of multiple Events.

Each Event represents one meaningful action performed during execution.

Examples include:

- API Calls
- File Access
- Command Execution
- Network Connections
- Tool Usage
- Database Operations

Events are stored in chronological order.

---

# Ownership

ASES defines only the structure of an Observation.

It does not define:

- Security severity
- Threat classification
- Attack taxonomy
- Risk scoring
- ML predictions

Those responsibilities belong exclusively to the Machine Learning Engine.

---

# Versioning

ASES follows independent semantic versioning.

Changes to ASES do not require changes to the SentinelX platform version.

Example:

ASES v1.0

↓

ASES v1.1

↓

ASES v2.0

---

# Compatibility

Minor versions should remain backward compatible whenever possible.

Breaking structural changes require a major version increment.

---

# References

- EVENT_DICTIONARY.md
- ASES_JSON_SCHEMA.md
- ML_CONTRACT.md