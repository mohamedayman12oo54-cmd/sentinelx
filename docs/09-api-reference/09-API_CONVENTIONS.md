---
title: API Conventions
category: API Reference
status: Approved
version: v1
---

# API Conventions

## Purpose

This document defines the general conventions followed by every SentinelX API endpoint.

---

# URL Structure

- Resource-oriented URLs.
- Plural resource names.
- Version prefix (`/api/v1`).

---

# HTTP Methods

| Method | Usage |
|---------|-------|
|GET|Retrieve resources.|
|POST|Create resources or trigger business actions.|
|PATCH|Partially update resources.|
|DELETE|Not used for business entities in Version 1.|

---

# Content Type

Requests and responses use:

```
application/json
```

---

# Date & Time

All timestamps use:

- ISO 8601
- UTC timezone

Example:

```
2026-07-24T15:42:18Z
```

---

# Resource Identifiers

Resources are identified by opaque IDs.

Clients must not infer business meaning from identifiers.

---

# Status Codes

HTTP status codes follow standard REST semantics.

See:

- ERROR_CODES.md

---

# Versioning

All public endpoints are versioned.

Example:

```
/api/v1
```

Future versions introduce new contracts without breaking existing ones.