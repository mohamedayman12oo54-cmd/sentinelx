---
title: Database Schema
category: Database Reference
status: Approved
version: 1.0

depends_on:
  - DATABASE_DESIGN.md
  - DOMAIN_MODEL.md

related_documents:
  - ENTITY_REFERENCE.md

related_diagrams:
  - Entity Relationship Diagram
---

# Database Schema

## Overview

This document describes the logical database schema used by SentinelX.

It defines the primary entities persisted by the platform and their relationships.

This document intentionally omits implementation-specific SQL syntax.

---

# Core Tables

Version 1 includes:

- organizations
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

- policies
- behavioral_profiles
- threat_feeds
- agent_roles