---
title: Agents API
category: API Reference
status: Approved
version: v1
---

# Agents API

## GET /api/v1/agents

Returns all Agents belonging to the authenticated organization.

---

## POST /api/v1/agents

Creates a new Agent.

---

## GET /api/v1/agents/{agentId}

Returns Agent details.

---

## PATCH /api/v1/agents/{agentId}

Updates mutable Agent information.

---

## PATCH /api/v1/agents/{agentId}/archive

Archives an Agent.

Archived Agents are preserved for historical integrity.

---

## POST /api/v1/agents/{agentId}/rotate-api-key

Generates a new API Key.

The previous key becomes invalid immediately.

---

## GET /api/v1/agents/{agentId}/observations

Returns Observations submitted by the specified Agent.

Supports pagination.