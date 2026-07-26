---
title: User Journey
category: Product
status: Approved
version: 1.0
owner: SentinelX Team

depends_on:
  - PRODUCT_STORY.md

related_documents:
  - BUSINESS_FLOW.md

related_diagrams:
  - User Journey Diagram
---

# User Journey

## Introduction

This document describes the complete journey of an organization using SentinelX from initial registration to receiving security insights.

---

# Step 1 — Organization Registration

A company creates a SentinelX account.

This account represents the organization within the platform.

---

# Step 2 — Agent Registration

The organization registers one or more AI Agents.

Each Agent receives its own API Key.

This API Key uniquely identifies future Observations submitted by that Agent.

---

# Step 3 — SDK Integration

The organization installs the SentinelX SDK inside its AI Agent.

The SDK automatically collects execution events while the agent performs tasks.

No manual interaction is required after integration.

---

# Step 4 — Task Execution

The AI Agent performs its normal work.

Examples include:

- Calling APIs.
- Reading files.
- Executing commands.
- Accessing tools.
- Communicating with external services.

---

# Step 5 — Observation Generation

After task completion, the SDK converts the collected execution events into a standardized ASES Observation.

---

# Step 6 — Observation Submission

The SDK securely sends the Observation to the SentinelX REST API using the Agent API Key.

---

# Step 7 — Security Analysis

SentinelX validates the Observation.

The ML Engine analyzes its contents and determines whether suspicious behavior exists.

---

# Step 8 — Dashboard Update

The analysis result appears inside the SentinelX Dashboard.

If dangerous behavior is detected, the platform generates a security alert.

---

# Final Outcome

The organization receives both:

- The complete execution history.
- An explainable security assessment.