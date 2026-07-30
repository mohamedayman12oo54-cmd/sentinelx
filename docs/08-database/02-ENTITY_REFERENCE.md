---
title: Entity Reference
category: Database Reference
status: Approved
version: 1.0

depends_on:
  - DATABASE_SCHEMA.md

related_documents:
  - DOMAIN_MODEL.md

related_diagrams:
  - ER Diagram
---

# Entity Reference

## Purpose

This document defines the responsibility of each persisted entity within SentinelX.

---

# Organization

Represents a customer organization.

Owns:

- Users
- Agents
- Observations
- Alerts

---

# User

Represents a human who authenticates to manage an Organization.

Owns:

- Nothing directly persisted beyond its own profile — acts upon entities owned by its Organization, subject to its Role.

**V1 scope note:** one Owner User per Organization at registration; multi-member Team Management is deferred (see `docs/backend/authentication/08-identity-lifecycle.md`).

---

# Agent

Represents a registered AI Agent.

Owns:

- API Key
- Observations

---

# Observation

Represents one immutable execution submitted by an Agent.

Contains:

- Context
- Events
- Metadata

---

# Prediction

Represents the ML Engine analysis for an Observation.

Contains:

- Verdict
- Risk Score
- Evidence

---

# Alert

Represents a notification generated after policy evaluation.

---

# API Key

Represents an authentication credential assigned to an Agent.