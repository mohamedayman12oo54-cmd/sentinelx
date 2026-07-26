---
title: Database Design
category: Architecture
status: Approved
version: 1.0

depends_on:
  - DOMAIN_MODEL.md

related_documents:
  - BACKEND_ARCHITECTURE.md

related_diagrams:
  - Database ER Diagram
---

# Database Design

## Overview

The SentinelX database persists all platform data required for authentication, observation storage, prediction history, and dashboard visualization.

The database is optimized for immutable Observation storage and efficient historical querying.

---

# Primary Entities

Version 1 includes:

- Organizations
- Agents
- API Keys
- Observations
- Predictions
- Alerts

---

# Observation Storage Strategy

Observations are stored exactly as received.

The original payload is never modified after persistence.

Prediction results are stored separately from the original Observation.

---

# Design Principles

The database follows these principles:

- Immutable Observations
- Referential Integrity
- Normalized business entities
- Separation of raw observations and ML results

---

# Future Evolution

Future versions may introduce additional entities for:

- Agent Roles
- Policies
- Behavioral Profiles
- Threat Intelligence
- Historical Baselines

These entities are intentionally excluded from Version 1.