---
title: Data Lifecycle
category: Database Reference
status: Approved
version: 1.0

depends_on:
  - DATABASE_SCHEMA.md
  - ML_CONTRACT.md

related_documents:
  - BACKEND_ARCHITECTURE.md

related_diagrams:
  - Observation Lifecycle Diagram
---

# Data Lifecycle

## Overview

This document describes how data moves through the SentinelX platform from creation to long-term storage.

---

# Lifecycle

Observation Generated

↓

Observation Submitted

↓

Authentication

↓

Validation

↓

Persistence

↓

ML Analysis

↓

Prediction Stored

↓

Alert Evaluation

↓

Dashboard Query

---

# Immutability

Observations remain immutable after persistence.

Predictions are stored independently.

---

# Retention

Historical Observations remain available for future analysis and auditing.

Retention policies are organization-specific and may evolve in future versions.