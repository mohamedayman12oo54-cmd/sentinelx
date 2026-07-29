---
title: Database Schema
category: Database Reference
status: Approved
version: 2.0

depends_on:
  - DATABASE_DESIGN.md
  - DOMAIN_MODEL.md

related_documents:
  - ENTITY_REFERENCE.md

related_diagrams:
  - Entity Relationship Diagram
---

# Database Schema

> **Baseline v2.0 note:** the `users` table was added to reflect the Human Identity layer designed in the Authentication series. Full column-level detail lives in `docs/backend/database/schema/entities.md`; this document remains a high-level reference.

## Overview

This document describes the logical database schema used by SentinelX.

It defines the primary entities persisted by the platform and their relationships.

This document intentionally omits implementation-specific SQL syntax.

---

# Core Tables

Version 1 includes:

- organizations
- users
- agents
- api_keys
- observations
- predictions
- alerts

---

# Relationship Summary

Organization

↓

1:N

↓

User

Organization

↓

1:N

↓

Agent

↓

1:N

↓

Observation

↓

1:1

↓

Prediction

↓

0:N

↓

Alert

---

# Design Principles

The schema follows:

- Referential Integrity
- Immutable Observations
- Normalized business entities
- Explicit foreign keys

---

# Future Tables

Future versions may introduce:

- invitations (Team Management / Invitation-based onboarding — designed, see `docs/backend/authentication/08-identity-lifecycle.md`)
- policies
- behavioral_profiles
- threat_feeds
- agent_roles