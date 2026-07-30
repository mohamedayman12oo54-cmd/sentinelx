---
title: API Error Codes
category: API Reference
status: Approved
version: v1

related_documents:
  - API_CONVENTIONS.md
---

# API Error Codes

## Overview

SentinelX uses standardized HTTP status codes and a consistent JSON error format.

Applications should rely on both the HTTP status code and the machine-readable error code when handling failures.

---

# Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted observation is invalid.",
    "details": {}
  }
}
```

---

# Standard Error Codes

| HTTP | Code | Description |
|------|------|-------------|
|400|BAD_REQUEST|Malformed request.|
|401|UNAUTHORIZED|Authentication required or invalid credentials.|
|403|FORBIDDEN|Authenticated but not permitted.|
|404|NOT_FOUND|Requested resource does not exist.|
|409|CONFLICT|Operation conflicts with current resource state.|
|422|VALIDATION_ERROR|Request validation failed.|
|429|RATE_LIMIT_EXCEEDED|Too many requests.|
|500|INTERNAL_SERVER_ERROR|Unexpected server error.|
|503|SERVICE_UNAVAILABLE|Dependent service temporarily unavailable.|

---

# Notes

Machine-readable codes are considered part of the public API contract and remain stable across versions.