---
title: Glossary
category: Reference
status: Approved
version: 1.0

depends_on: []

related_documents:
  - All Documentation

related_diagrams: []
---

# Glossary

## Purpose

This document defines the official terminology used throughout the SentinelX documentation.

Using a shared vocabulary ensures consistency across engineering, product, and machine learning documentation.

---

# Terms

## Organization

A customer using the SentinelX platform.

---

## User

A human who authenticates into SentinelX to manage an Organization and view its data, distinct from an Agent. Holds a Role (`Owner`, `Admin`, or `Member`). Added to the Baseline in v2.0 — full design in `docs/backend/authentication/`.

---

## Agent

An AI system registered by an Organization.

---

## Observation

A complete execution record submitted by an Agent after finishing a task.

---

## Event

A single recorded action inside an Observation.

---

## ASES

Agent Security Event Specification.

The official format used to exchange Observations.

---

## Prediction

The ML Engine's security assessment for an Observation.

---

## Verdict

The final security decision returned by the ML Engine.

Examples:

- SAFE
- SUSPICIOUS
- MALICIOUS

---

## Evidence

Human-readable explanation supporting a Prediction.

---

## Alert

A notification generated when platform policies require user attention.

---

## SDK

The SentinelX Software Development Kit installed inside an AI Agent.

---

## API Key

The authentication credential assigned to each Agent.

---

## ML Engine

The service responsible for analyzing Observations and producing Predictions.