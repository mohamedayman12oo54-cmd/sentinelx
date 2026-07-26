---
title: Pagination
category: API Reference
status: Approved
version: v1
---

# Pagination

## Overview

All collection endpoints return paginated results.

Examples include:

- Agents
- Observations
- Alerts

---

# Request Parameters

| Parameter | Description |
|-----------|-------------|
|page|Page number (starts at 1).|
|per_page|Number of items per page.|

---

# Response Format

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 245,
    "total_pages": 13
  }
}
```

---

# Design Principles

- Predictable response format.
- Consistent across all collection endpoints.
- Metadata separated from business data.