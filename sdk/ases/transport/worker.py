"""Worker — a background thread that pulls Observations from the Queue and
hands them to the Serializer and API Client (10-transport-layer.md,
section 7). The Worker never sends anything itself — it delegates entirely
to the API Client, so a future transport mechanism (e.g. a message broker)
only ever touches the Client and/or Serializer, never the Queue or Worker.
"""

from __future__ import annotations

import threading
from typing import Optional

from ases.transport.client import APIClient
from ases.transport.queue import ObservationQueue
from ases.transport.serializer import serialize_observation
from ases.shared.logger import get_logger


class Worker:
    def __init__(self, obs_queue: ObservationQueue, client: APIClient) -> None:
        self._queue = obs_queue
        self._client = client
        self._logger = get_logger("transport.worker")
        self._stop_event = threading.Event()
        self._thread = threading.Thread(
            target=self._run, name="ases-transport-worker", daemon=True
        )

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()

    def join(self, timeout: Optional[float] = None) -> None:
        self._thread.join(timeout=timeout)

    def _run(self) -> None:
        while not self._stop_event.is_set():
            observation = self._queue.get(timeout=1.0)
            if observation is None:
                continue
            try:
                payload = serialize_observation(observation)
                delivered = self._client.send(payload)
                if not delivered:
                    # The API Client itself already logged the specific
                    # reason (retries exhausted, authentication failure,
                    # non-retryable rejection — see transport/client.py's
                    # own three-way classification, RC-8 IDENTITY-002).
                    # This is deliberately generic, not a duplicate claim
                    # that retries were always exhausted.
                    self._logger.warning(
                        "Observation dropped (%d event(s)).",
                        len(observation.events),
                    )
            except Exception:  # noqa: BLE001 — Transport must never crash the
                # host Agent (ADR-004); a defect here must be logged and
                # swallowed, not left to kill this daemon thread silently.
                self._logger.exception(
                    "Unexpected error while delivering an Observation — dropped."
                )
            finally:
                self._queue.task_done()
