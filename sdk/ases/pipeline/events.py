"""Signal types an Adapter may emit — EVENT and OBSERVATION_COMPLETED, and
nothing else (ADR-002; adapter-signal-contract.md).

These are the ONLY two shapes that cross the boundary from an Adapter into
the Event Pipeline. No component downstream of the Pipeline ever receives a
raw Adapter signal directly — the Observation Collector is the sole
consumer (adapter-signal-contract.md, section 6).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict

from ases.shared.constants import (
    SIGNAL_TYPE_EVENT,
    SIGNAL_TYPE_OBSERVATION_COMPLETED,
    VALID_COMPLETION_REASONS,
)
from ases.shared.exceptions import AdapterError


@dataclass(frozen=True)
class EventSignal:
    """"I observed something happen." (adapter-signal-contract.md, section 2)"""

    event_type: str
    payload: Dict[str, Any]
    runtime_context: Dict[str, Any]
    timestamp: str
    signal_type: str = field(default=SIGNAL_TYPE_EVENT, init=False)

    def __post_init__(self) -> None:
        if not self.event_type or not isinstance(self.event_type, str):
            raise AdapterError("EventSignal.event_type must be a non-empty string.")
        if not isinstance(self.payload, dict):
            raise AdapterError("EventSignal.payload must be a dict.")
        if not isinstance(self.runtime_context, dict) or not self.runtime_context:
            raise AdapterError(
                "EventSignal.runtime_context is required and must be a "
                "non-empty dict — it is how the Collector correlates this "
                "Event with the rest of its in-flight Observation."
            )
        if not self.timestamp or not isinstance(self.timestamp, str):
            raise AdapterError("EventSignal.timestamp must be a non-empty ISO 8601 string.")


@dataclass(frozen=True)
class ObservationCompletedSignal:
    """"I observed that execution has ended." (adapter-signal-contract.md, section 3)"""

    runtime_context: Dict[str, Any]
    reason: str
    timestamp: str
    signal_type: str = field(default=SIGNAL_TYPE_OBSERVATION_COMPLETED, init=False)

    def __post_init__(self) -> None:
        if not isinstance(self.runtime_context, dict) or not self.runtime_context:
            raise AdapterError(
                "ObservationCompletedSignal.runtime_context is required and "
                "must match the runtime_context of the Events being closed out."
            )
        if self.reason not in VALID_COMPLETION_REASONS:
            raise AdapterError(
                f"ObservationCompletedSignal.reason must be one of "
                f"{sorted(VALID_COMPLETION_REASONS)}, got {self.reason!r}."
            )
        if not self.timestamp or not isinstance(self.timestamp, str):
            raise AdapterError(
                "ObservationCompletedSignal.timestamp must be a non-empty ISO 8601 string."
            )
