---
title: Backend Architecture
category: Architecture
status: Approved
version: 2.0

depends_on:
  - DOMAIN_MODEL.md

related_documents:
  - REST_API.md
  - DATABASE_DESIGN.md

related_diagrams:
  - Backend Architecture Diagram
---

# Backend Architecture

> **Baseline v2.0 note:** this document was a high-level, pre-implementation sketch. A full Backend Architecture design series (9 sessions) was completed afterward, defining the actual module set, module dependencies, and implementation layers in detail. This document is updated to summarize that outcome; the authoritative, full detail lives in `docs/backend/backend-architecture/`.

## Overview

The SentinelX Backend acts as the central orchestration layer of the platform.

It receives Observations, validates requests, coordinates processing, communicates with the ML Engine, stores results, and serves the Dashboard. It also authenticates and authorizes both human Users (Dashboard) and AI Agents (SDK).

---

# Responsibilities

The Backend is responsible for:

- Authentication (Human and Agent)
- Authorization (Role-based for Users, Capability-based for Agents)
- Organization management
- Agent management
- Observation validation
- Observation persistence
- ML communication
- Prediction persistence
- Alert generation
- Dashboard APIs
- Audit logging

---

# Modules (Baseline v2.0)

The Backend is organized as a **Modular Monolith** of 8 business modules — not a flat set of "Services." Full detail, including responsibilities and one-way dependency rules for each, is in `docs/backend/backend-architecture/03-system-modules.md` through `05-module-dependencies.md`.

```text
Authentication   (includes Identity and API Key submodules)
Organization
Agent
Observation
Analysis          (formerly referred to as "Prediction Service")
Alert
Dashboard
Audit
```

---

# Processing Flow

Observation Received

↓

Authentication

↓

Authorization

↓

Validation

↓

Storage

↓

ML Analysis

↓

Prediction Storage

↓

Alert Evaluation

↓

Dashboard

---

# Design Principles

The Backend should remain:

- Stateless
- Modular
- Testable
- Extensible

Business Logic lives in the **Application Layer** of each module, implemented using **Actions** (one Action per use case) — not "Services." See `docs/backend/backend-architecture/06-implementation-layers.md` and `docs/backend/backend-architecture/adr/ADR-004-actions-over-services.md` for the full rationale behind this convention.