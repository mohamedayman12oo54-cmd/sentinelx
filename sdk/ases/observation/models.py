"""Data models for Event, Observation, and ObservationMetadata.

Per 13-implementation-roadmap.md, Phase 4: pure data shapes with no logic
attached, built before the Collector, Builder, or Validator.

!! SCHEMA ASSUMPTION — CONFIRM AGAINST THE REAL BACKEND !!

09-observation-lifecycle.md references an external "ASES JSON Schema
documentation" that defines the exact wire format SentinelX expects. That
document was not part of the documentation set this SDK was built from. The
shape below is a deliberate, documented reconstruction from everything that
*is* specified:

  - The Canonical Event Model, `{ "event_type": ..., "payload": ... }`
    (01-overview.md, section 4.2).
  - The Header / Metadata / Payload split named explicitly in the
    Implementation Roadmap, Phase 4.
  - The field list already fixed by adapter-signal-contract.md
    (event_type, payload, timestamp).

Every place this schema is used is confined to this file plus
transport/serializer.py, by design (10-transport-layer.md, section 6:
"If a future version sends data over gRPC instead of HTTP, the Builder
changes zero lines"). Confirm the real shape against the Laravel backend's
validation rules and adjust only these two files if it differs.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass(frozen=True)
class Event:
    """A single occurrence within an Observation — the Canonical Event
    Model shape (01-overview.md, section 4.2)."""

    event_type: str
    payload: Dict[str, Any]
    timestamp: str  # ISO 8601, e.g. "2026-08-01T10:15:32Z"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_type": self.event_type,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class ObservationMetadata:
    """Everything about an Observation that is not itself an Event."""

    sdk_version: str
    environment: str
    started_at: str
    completed_at: str
    completion_reason: str
    event_count: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sdk_version": self.sdk_version,
            "environment": self.environment,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "completion_reason": self.completion_reason,
            "event_count": self.event_count,
        }


@dataclass(frozen=True)
class Observation:
    """The complete execution story of a single Agent Task
    (09-observation-lifecycle.md, section 1).

    Deliberately carries no observation_id or task_id: correlation is
    internal-only, via runtime_context, and never part of the outward-facing
    wire format (09-observation-lifecycle.md, section 5). SentinelX assigns
    its own identifier on receipt.
    """

    events: List[Event]
    metadata: ObservationMetadata

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metadata": self.metadata.to_dict(),
            "events": [event.to_dict() for event in self.events],
        }
