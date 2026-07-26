---
title: Backend Architecture
category: Architecture
status: Approved
version: 1.0

depends_on:
  - DOMAIN_MODEL.md

related_documents:
  - REST_API.md
  - DATABASE_DESIGN.md

related_diagrams:
  - Backend Architecture Diagram
---

# Backend Architecture

## Overview

The SentinelX Backend acts as the central orchestration layer of the platform.

It receives Observations, validates requests, coordinates processing, communicates with the ML Engine, stores results, and serves the Dashboard.

---

# Responsibilities

The Backend is responsible for:

- Authentication
- Observation validation
- Observation persistence
- ML communication
- Prediction persistence
- Alert generation
- Dashboard APIs

---

# High-Level Components

Version 1 consists of:

- REST API Layer
- Authentication Layer
- Observation Service
- ML Integration Layer
- Prediction Service
- Alert Service
- Dashboard Service

---

# Processing Flow

Observation Received

↓

Authentication

↓

Validation

↓

Storage

↓

ML Analysis

↓

Prediction Storage

↓

Alert Evaluation

↓

Dashboard

---

# Design Principles

The Backend should remain:

- Stateless
- Modular
- Testable
- Extensible

Business logic belongs inside Services rather than Controllers.