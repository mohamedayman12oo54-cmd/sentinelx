---
title: Backend Components Diagram
diagram_id: D-03
diagram_type: Component Diagram
status: Approved
version: 2.0

source_documents:
  - BACKEND_ARCHITECTURE.md
  - API_REFERENCE.md
---

# Purpose

Describe the logical components inside the Backend API.

> **Baseline v2.0 note:** updated from 6 components to the 8-module Baseline v2.0 set. `Authentication` now covers both Identity (Users, JWT) and API Key concerns as internal submodules; `Predictions` is renamed `Analysis`; `Organization` and `Audit` are added. Full detail: `docs/backend/backend-architecture/03-system-modules.md`.

---

# Audience

- Backend Engineers
- Architects

---

# Question Answered

How is the Backend API internally organized?

---

# Includes

- Authentication (Identity + API Key submodules)
- Organization
- Agent
- Observation
- Analysis
- Alert
- Dashboard
- Audit

---

# Excludes

- Database tables
- Controllers
- Laravel implementation details

---

# Diagram Style

Component Diagram