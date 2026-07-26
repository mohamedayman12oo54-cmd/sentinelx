---
title: Dashboard API
category: API Reference
status: Approved
version: v1
---

# Dashboard API

## Overview

The Dashboard endpoint aggregates the most commonly requested operational data into a single response.

This minimizes frontend requests and improves dashboard loading performance.

---

# GET /api/v1/dashboard

Returns an aggregated dashboard snapshot.

Typical response sections include:

- Organization statistics
- Recent Alerts
- Recent Observations
- Risk distribution
- Active Agents

---

## Authentication

JWT

---

## Success Response

```
200 OK
```

Returns a single JSON object containing all dashboard widgets.

---

## Notes

The response structure is optimized for dashboard rendering rather than representing a single domain entity.