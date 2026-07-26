---
title: Diagram Index
category: Diagrams
status: Approved
version: 1.0
---

# Diagram Index

## Purpose

This document serves as the master index for all architecture diagrams in the SentinelX documentation.

Each diagram has a clearly defined purpose, scope, and source documents.

Diagrams visualize the architecture; they do not introduce new design decisions.

---

# Diagram Catalog

| ID | Diagram | Purpose | Source Documents |
|----|----------|---------|------------------|
| D-01 | System Context | External system overview | PRODUCT_VISION, SYSTEM_OVERVIEW |
| D-02 | C4 Container | Major deployable components | BACKEND_ARCHITECTURE |
| D-03 | Backend Components | Internal backend modules | BACKEND_ARCHITECTURE |
| D-04 | Observation Processing | Runtime request flow | OBSERVATIONS_API, ML_CONTRACT |
| D-05 | ML Analysis | Backend ↔ ML interaction | ML_CONTRACT |
| D-06 | Alert Lifecycle | Alert state transitions | ALERTS_API |
| D-07 | Observation Lifecycle | Observation state transitions | DATA_LIFECYCLE |
| D-08 | Entity Relationship Diagram | Database model | DATABASE_SCHEMA |
| D-09 | ASES Observation | Canonical Observation structure | ASES_SPECIFICATION |
| D-10 | ML Contract | Request/Response relationship | ML_CONTRACT |
| D-11 | Deployment | Logical deployment topology | DEPLOYMENT_ARCHITECTURE |
| D-12 | Security Trust Boundaries | Security zones | SECURITY_ARCHITECTURE |
| D-13 | Monitoring Architecture | Operational visibility | MONITORING_STRATEGY |

---

# Diagram Principles

- Every diagram answers a specific architectural question.
- Every diagram maps directly to existing documentation.
- No diagram introduces undocumented behavior.
- Mermaid is the canonical source format.