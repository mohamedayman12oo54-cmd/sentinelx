---
title: ASES JSON Schema
category: Specification
status: Frozen
version: 1.0
owner: SentinelX Team

depends_on:
  - ASES_SPECIFICATION.md
  - EVENT_DICTIONARY.md

related_documents:
  - ML_CONTRACT.md

related_diagrams:
  - Observation JSON Structure
---

# ASES JSON Schema

## Overview

This document defines the official JSON structure exchanged between the SentinelX SDK and the SentinelX Backend.

Every submitted Observation must conform to this schema.

---

# Root Structure

An Observation contains three primary sections:

- Context
- Events
- Metadata

---

# Context

The Context describes the execution environment.

Examples include:

- Framework
- Agent Version
- Environment
- Execution Start Time
- Execution Finish Time

---

# Events

The Events array contains all recorded execution events.

Each event includes:

- Header
- Payload

Events must remain ordered according to execution sequence.

---

# Metadata

Metadata describes the Observation itself.

Examples include:

- Specification Version
- SDK Version
- Generation Timestamp

---

# Validation Rules

Every Observation must:

- Be valid JSON
- Follow the official schema
- Include all required fields
- Preserve chronological event ordering
- Include at least one Event

---

# Authentication

Authentication is intentionally excluded from the Observation.

Agent identity is determined exclusively through the API Key supplied with the HTTP request.

---

# Immutability

Once accepted by SentinelX, an Observation is never modified.

The stored Observation always represents the exact payload received from the SDK.

---

# Examples

See the official Observation examples included in the SDK documentation and ML Contract documentation.