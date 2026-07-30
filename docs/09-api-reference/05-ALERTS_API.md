---
title: Alerts API
category: API Reference
status: Approved
version: v1
---

# Alerts API

## Overview

Alerts are generated after the Backend evaluates ML Predictions against platform security policies.

Alerts represent actionable security incidents.

---

# GET /api/v1/alerts

Returns paginated Alerts for the authenticated organization.

---

# GET /api/v1/alerts/{alertId}

Returns complete Alert details including the related Observation and Prediction.

---

# PATCH /api/v1/alerts/{alertId}/acknowledge

Marks an Alert as acknowledged.

Acknowledging an Alert indicates that a user has reviewed the incident.

---

# PATCH /api/v1/alerts/{alertId}/resolve

Marks an Alert as resolved.

Resolution represents the completion of the incident handling process.

---

## Authentication

JWT

---

## Notes

Alerts are never created directly by users.

They are generated automatically by the platform.