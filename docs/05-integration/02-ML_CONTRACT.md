---
title: ML Contract
category: Integration
status: Frozen
version: 1.0
owner: SentinelX Team

depends_on:
  - ASES_JSON_SCHEMA.md

related_documents:
  - REST_API.md
  - ASES_SPECIFICATION.md

related_diagrams:
  - ML Processing Flow Diagram
---

# ML Contract

## Overview

The ML Contract defines the official communication protocol between the SentinelX Backend and the Machine Learning Engine.

Both components evolve independently while remaining compatible through this contract.

---

# Purpose

The Backend is responsible for collecting and validating Observations.

The ML Engine is responsible for analyzing those Observations and producing security predictions.

Neither component depends on the internal implementation of the other.

---

# Request

The Backend sends:

- Observation
- Analysis Options

The Observation must follow the official ASES Specification.

---

# Response

The ML Engine returns:

- Verdict
- Risk Score
- Confidence
- Summary
- Reasons
- Evidence

---

# Responsibilities

Backend Responsibilities

- Authentication
- Validation
- Storage
- ML Communication
- Alert Generation

ML Responsibilities

- Security Analysis
- Threat Classification
- Evidence Generation
- Risk Assessment

---

# Version Compatibility

The ML Contract is independently versioned.

Changes to the ML Engine do not require Backend modifications unless the contract changes.

---

# Design Principles

The contract should remain:

- Stable
- Minimal
- Explicit
- Framework-independent
- Backward compatible whenever possible