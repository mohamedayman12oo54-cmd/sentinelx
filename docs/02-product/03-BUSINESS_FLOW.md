---
title: Business Flow
category: Product
status: Approved
version: 1.0
owner: SentinelX Team

depends_on:
  - USER_JOURNEY.md

related_documents:
  - ASES_SPECIFICATION.md

related_diagrams:
  - Business Flow Diagram
---

# Business Flow

## Overview

This document describes how a single Observation moves through SentinelX from creation until the final prediction is displayed.

---

# Step 1 — Agent Execution

The AI Agent executes a task.

During execution, the SentinelX SDK records security-relevant events.

---

# Step 2 — Observation Creation

The SDK transforms the recorded events into a standardized ASES Observation.

---

# Step 3 — Observation Submission

The Observation is submitted to the SentinelX REST API.

Authentication is performed using the Agent API Key.

---

# Step 4 — Observation Validation

SentinelX validates:

- Authentication
- Schema
- Required fields
- Specification version

---

# Step 5 — Observation Storage

The validated Observation is stored without modification.

The original Observation always remains immutable.

---

# Step 6 — ML Analysis

SentinelX sends the Observation to the ML Engine.

The ML Engine evaluates the execution and returns:

- Verdict
- Risk Score
- Confidence
- Evidence
- Security Summary

---

# Step 7 — Result Storage

The prediction returned by the ML Engine is stored alongside the Observation.

---

# Step 8 — Alert Evaluation

The Backend evaluates the prediction.

If the configured alert policy is satisfied, a security alert is generated.

---

# Step 9 — Dashboard Presentation

The organization views:

- Observation details.
- ML prediction.
- Evidence.
- Alert status.
- Historical executions.

---

# End of Flow

The Observation becomes part of the organization's permanent security history and remains available for future investigation and reporting.