---
title: ASES Event Dictionary
category: Specification
status: Frozen
version: 1.0
owner: SentinelX Team

depends_on:
  - ASES_SPECIFICATION.md

related_documents:
  - ASES_JSON_SCHEMA.md

related_diagrams:
  - Event Dictionary Diagram
---

# Event Dictionary

## Overview

The Event Dictionary defines the official vocabulary used inside ASES Observations.

Every execution event belongs to one predefined event type.

This ensures consistency across all AI frameworks and SDK implementations.

---

# Event Categories

Version 1 defines the following event categories.

| Event Type | Description |
|------------|-------------|
| api_call | Communication with external or internal APIs |
| file_access | Reading or writing files |
| command_execution | Executing operating system commands |
| network_connection | Opening network connections |
| database_operation | Database queries or modifications |
| tool_execution | Calling external tools |
| memory_operation | Reading or modifying agent memory |
| authentication | Authentication-related actions |
| configuration_change | Runtime configuration changes |
| custom | Framework-specific events |

---

# Event Structure

Every Event contains:

- Header
- Payload

The Header describes the event.

The Payload describes what happened.

---

# Event Naming Rules

Event names must:

- Use lowercase
- Use snake_case
- Be stable across SDK versions
- Represent actions rather than technologies

Correct:

- file_access

Incorrect:

- LinuxFileRead

---

# SDK Responsibilities

The SDK records events exactly as they occur.

The SDK does not assign:

- Threat labels
- Risk scores
- Attack categories

Those decisions belong to the ML Engine.

---

# Future Extensions

Additional event types may be introduced in future ASES versions while preserving backward compatibility whenever possible.