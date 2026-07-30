---
title: Observation Processing Sequence
diagram_id: D-04
diagram_type: Sequence Diagram
status: Approved
version: 1.0

source_documents:
  - OBSERVATIONS_API.md
  - ML_CONTRACT.md
  - BACKEND_ARCHITECTURE.md
---

# Purpose

Describe the end-to-end processing of an Observation from the SDK until results become visible in the Dashboard.

---

# Audience

- Backend Engineers
- ML Engineers
- Architects

---

# Question Answered

What happens after an SDK submits an Observation?

---

# Includes

- SDK
- Backend API
- Database
- Queue
- ML Service

---

# Excludes

- Internal ML implementation
- Database schema
- Alert lifecycle

---

# Diagram Style

Mermaid Sequence Diagram