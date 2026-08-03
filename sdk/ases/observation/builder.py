"""Observation Builder — the first component in the pipeline that knows the
ASES Schema (08-internal-architecture.md, section 4). Framework-independent
and Stateless: it runs exactly once, after the Collector finishes
gathering Events, never incrementally per-Event (09-observation-lifecycle.md,
section 7: "The Builder is Stateless. It runs once, after collection
completes, and only the Collector ever tells it to start.").
"""

from __future__ import annotations

from typing import List

from ases.observation.models import Event, Observation, ObservationMetadata
from ases.pipeline.events import EventSignal
from ases.shared.constants import SDK_VERSION


def build_observation(
    signals: List[EventSignal], completion_reason: str, environment: str
) -> Observation:
    """Convert a finished group of EventSignals into a single Observation.

    Raises ValueError if given an empty list — the Collector never calls
    this with zero Events (see collector._finalize's own empty-events
    guard), so an empty list here indicates a caller error, not a normal
    runtime condition.
    """
    if not signals:
        raise ValueError("build_observation() requires at least one EventSignal.")

    events = [
        Event(event_type=s.event_type, payload=s.payload, timestamp=s.timestamp)
        for s in signals
    ]

    metadata = ObservationMetadata(
        sdk_version=SDK_VERSION,
        environment=environment,
        started_at=signals[0].timestamp,
        completed_at=signals[-1].timestamp,
        completion_reason=completion_reason,
        event_count=len(events),
    )
    return Observation(events=events, metadata=metadata)
