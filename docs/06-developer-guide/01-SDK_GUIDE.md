---
title: SentinelX SDK Guide
category: Developer Guide
status: Approved
version: 1.0
owner: SentinelX Team

depends_on:
  - ASES_SPECIFICATION.md
  - SECURITY_MODEL.md

related_documents:
  - ASES_JSON_SCHEMA.md
  - API_REFERENCE.md

related_diagrams:
  - SDK Integration Flow
---

# SentinelX SDK Guide

## Overview

The SentinelX SDK enables AI Agents to submit execution observations to the SentinelX Platform.

The SDK abstracts communication with the SentinelX REST API and automatically generates ASES-compliant Observations.

---

# Responsibilities

The SDK is responsible for:

- Capturing execution events.
- Building ASES Observations.
- Authenticating requests.
- Sending Observations.
- Handling API responses.

The SDK is **not** responsible for:

- Threat detection.
- Risk scoring.
- Security decisions.
- Event classification.

---

# Integration Flow

SDK integration follows four steps:

1. Install the SDK.
2. Configure the Agent API Key.
3. Instrument execution events.
4. Submit Observations automatically.

---

# Authentication

Every SDK instance authenticates using an Agent API Key issued by SentinelX.

No organization identifiers are embedded inside Observation payloads.

---

# Observation Lifecycle

Execution Starts

↓

SDK Collects Events

↓

Observation Created

↓

Observation Sent

↓

Backend Response Received

---

# Design Principles

The SDK should remain:

- Lightweight
- Framework-independent
- Reliable
- Backward compatible
- Easy to integrate