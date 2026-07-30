---
title: Deployment Architecture
category: Operational Architecture
status: Approved
version: 1.0

depends_on:
  - BACKEND_ARCHITECTURE.md
  - ML_INTEGRATION.md

related_diagrams:
  - Deployment Diagram
---

# Deployment Architecture

## Purpose

This document describes the logical deployment architecture of SentinelX.

It defines how major system components are deployed and communicate without prescribing specific infrastructure technologies.

---

# Core Components

- Dashboard (Frontend)
- Backend API
- ML Service
- Database
- Queue

---

# Communication

Dashboard

↓

Backend API

↓

Database

↓

Queue

↓

ML Service

---

# Design Principles

- Loose coupling
- Independent service deployment
- Stateless application services
- Isolated ML execution

---

# Future Evolution

The deployment architecture is designed to support horizontal scaling and cloud-native infrastructure without changing the application architecture.