---
title: Observations API
category: API Reference
status: Approved
version: v1

authentication:
  - API Key (SDK)
  - JWT (Dashboard)

related_documents:
  - ASES_SPECIFICATION.md
  - ML_CONTRACT.md
  - DATA_LIFECYCLE.md
---

# Observations API

## Overview

Observations represent immutable execution records submitted by AI Agents.

Observations are created exclusively by the SentinelX SDK and analyzed asynchronously by the ML Engine.

---

# POST /api/v1/observations

## Purpose

Submit a new Observation for security analysis.

---

## Authentication

API Key

---

## Request Body

ASES Observation JSON.

---

## Success Response

```
202 Accepted
```

The Observation has been accepted for asynchronous processing.

---

## Processing Pipeline

```
Receive
    ↓
Authenticate
    ↓
Validate
    ↓
Persist
    ↓
Queue
    ↓
ML Analysis
    ↓
Prediction Stored
```

---

# GET /api/v1/observations

Returns paginated Observations belonging to the authenticated organization.

Authentication:

JWT

---

# GET /api/v1/observations/{observationId}

Returns a single Observation together with its associated Prediction, if available.

Authentication:

JWT