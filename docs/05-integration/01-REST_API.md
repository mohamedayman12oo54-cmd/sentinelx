---
title: REST API Architecture
category: Integration
status: Approved
version: 1.0
owner: SentinelX Team

depends_on:
  - BACKEND_ARCHITECTURE.md

related_documents:
  - ML_CONTRACT.md
  - SECURITY_MODEL.md

related_diagrams:
  - REST API Flow Diagram
---

# REST API

## Overview

The SentinelX REST API is the primary communication interface between external clients and the SentinelX platform.

It provides a stable, versioned contract for SDKs, dashboards, and future integrations.

---

# Design Goals

The REST API is designed to be:

- Simple
- Predictable
- Versioned
- Secure
- Consistent

---

# Primary Responsibilities

The API is responsible for:

- Organization management
- Agent registration
- Observation ingestion
- Dashboard access
- Historical data retrieval

---

# API Style

Version 1 follows standard REST principles.

The API uses:

- JSON requests
- JSON responses
- HTTPS
- Stateless communication

---

# Versioning

Every public endpoint belongs to an API version.

Example:

/api/v1/

Future versions will coexist without breaking existing SDKs.

---

# Authentication

All protected endpoints require API authentication.

Authentication mechanisms are defined in the Security Model.

---

# Error Handling

Every API response follows a consistent response structure.

Errors always include:

- Error Code
- Human-readable Message
- Request Identifier

---

# Documentation

Endpoint-level documentation is maintained separately from this document.

This document focuses only on architectural principles.