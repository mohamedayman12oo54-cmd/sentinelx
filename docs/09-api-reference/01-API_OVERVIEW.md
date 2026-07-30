---
title: API Overview
category: API Reference
status: Approved
version: v1

depends_on:
  - REST_API_DESIGN.md

related_documents:
  - ML_CONTRACT.md
  - ASES_SPECIFICATION.md
---

# API Overview

## Purpose

The SentinelX REST API provides a stable and implementation-independent interface for interacting with the platform.

The API is designed around business resources rather than internal implementation details.

---

# Base URL

```
/api/v1
```

---

# Design Principles

- Resource-Oriented
- Stateless
- Consistent
- Predictable
- Stable
- Minimal

---

# Authentication

Two authentication mechanisms are supported.

## Dashboard Users

Authentication via JWT Access Token.

## SDK Clients

Authentication via Agent API Key.

---

# Versioning

All public endpoints are versioned.

Current version:

```
v1
```

Future versions will preserve backward compatibility whenever possible.

---

# Response Format

All endpoints return JSON responses.

HTTP status codes are used consistently to indicate request outcomes.

Detailed response schemas are documented in each resource-specific API reference.