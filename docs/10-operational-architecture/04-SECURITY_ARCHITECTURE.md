---
title: Security Architecture
category: Operational Architecture
status: Approved
version: 1.0

depends_on:
  - AUTHENTICATION.md
  - API_OVERVIEW.md
  - ML_CONTRACT.md

related_diagrams:
  - Security Architecture Diagram
---

# Security Architecture

## Purpose

This document describes the security boundaries and trust model of the SentinelX platform.

It defines how components authenticate, communicate, and protect sensitive data.

---

# Trust Boundaries

SentinelX is divided into the following logical trust zones:

- Public Internet
- Dashboard
- Backend API
- Internal Services
- Database

Each boundary enforces authentication and authorization independently.

---

# Authentication Model

Dashboard users authenticate using JWT Access Tokens.

SDK clients authenticate using Agent API Keys.

Internal services authenticate using private service-to-service communication.

---

# Authorization

Every authenticated request is scoped to a single organization.

Resources are never shared across organizations.

---

# Data Protection

Sensitive information is protected both in transit and at rest.

Examples include:

- API Keys
- Authentication Tokens
- Observation Data
- ML Predictions

---

# Design Principles

- Least Privilege
- Defense in Depth
- Zero Trust Between Components
- Secure by Default