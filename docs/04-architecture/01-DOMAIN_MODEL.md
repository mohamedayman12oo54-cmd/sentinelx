---
title: Domain Model
category: Architecture
status: Approved
version: 1.0
owner: SentinelX Team

depends_on:
  - BUSINESS_FLOW.md
  - ASES_SPECIFICATION.md

related_documents:
  - DATABASE_DESIGN.md
  - BACKEND_ARCHITECTURE.md

related_diagrams:
  - Domain Model Diagram
---

# Domain Model

## Overview

This document defines the core business entities of SentinelX and the relationships between them.

The Domain Model represents the business language of the platform independently of implementation details.

It is the foundation upon which the database, backend services, and APIs are built.

---

# Design Principles

The Domain Model focuses on business concepts rather than technical implementation.

It intentionally avoids discussing:

- Database tables
- REST endpoints
- Programming languages
- Frameworks

---

# Core Entities

Version 1 consists of the following primary entities.

- Organization
- Agent
- Observation
- Event
- Prediction
- Alert
- API Key

---

# Organization

Represents a customer using SentinelX.

Responsibilities:

- Owns Agents.
- Owns Observations.
- Owns Alerts.
- Manages API Keys.

---

# Agent

Represents an AI Agent registered inside an Organization.

Responsibilities:

- Authenticates using an API Key.
- Produces Observations.
- Executes Tasks outside SentinelX.
- Sends execution data through the SDK.

SentinelX does not execute the Agent itself.

---

# Observation

Represents one completed execution received from an Agent.

An Observation contains:

- Context
- Ordered Events
- Metadata

Observations are immutable after submission.

---

# Event

Represents one execution action inside an Observation.

Examples include:

- API Calls
- File Access
- Command Execution
- Network Activity

Events exist only within an Observation.

---

# Prediction

Represents the security analysis returned by the ML Engine.

A Prediction contains:

- Verdict
- Risk Score
- Confidence
- Summary
- Evidence

Each Observation has exactly one Prediction.

---

# Alert

Represents a notification generated after evaluating a Prediction.

Alerts exist only when platform policies determine that user attention is required.

---

# API Key

Represents the authentication identity of an Agent.

API Keys determine:

- Organization
- Agent

Agent identity is never included inside the Observation payload itself.

---

# Relationships

Organization

↓

owns

↓

Agent

↓

creates

↓

Observation

↓

contains

↓

Events

↓

analyzed by

↓

Prediction

↓

may generate

↓

Alert