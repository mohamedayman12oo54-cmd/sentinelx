"""Centralized constants for the ASES SDK.

Every literal that more than one module needs to agree on lives here, so
values like the retry count or the observation timeout are single-sourced
instead of duplicated across Transport and Observation. This is what keeps
"3 retries, then drop" (10-transport-layer.md) and "no new Event for 30
seconds" (09-observation-lifecycle.md) auditable in one place.
"""

from __future__ import annotations

SDK_NAME = "ases"
SDK_VERSION = "1.0.0"

# --- Networking -------------------------------------------------------
#
# !! ASSUMPTION — CONFIRM AGAINST THE REAL LARAVEL BACKEND !!
#
# 01-overview.md's illustrative example uses `POST /observations`.
# environment-configuration.md documents ASES_ENDPOINT as a *base* URL with
# no path. Neither document states the full path, the API version prefix,
# or the exact Authorization scheme the real Laravel routes/api.php expects.
# The values below are a reasonable, clearly-labeled placeholder — change
# them here (and nowhere else; see transport/client.py) once the real
# contract is confirmed.
DEFAULT_ASES_ENDPOINT = "https://api.sentinelx.example.com"
OBSERVATIONS_PATH = "/api/v1/observations"

DEFAULT_ENVIRONMENT = "production"

HTTP_REQUEST_TIMEOUT_SECONDS = 10.0

# --- Transport retry policy (ADR-004, 10-transport-layer.md) ----------
TRANSPORT_MAX_RETRIES = 3
TRANSPORT_SHUTDOWN_FLUSH_TIMEOUT_SECONDS = 5.0

# --- Observation Lifecycle (09-observation-lifecycle.md) --------------
OBSERVATION_TIMEOUT_SECONDS = 30

# --- Adapter signal contract (adapter-signal-contract.md) -------------
SIGNAL_TYPE_EVENT = "EVENT"
SIGNAL_TYPE_OBSERVATION_COMPLETED = "OBSERVATION_COMPLETED"

COMPLETION_REASON_FRAMEWORK_TASK_FINISHED = "framework_task_finished"
COMPLETION_REASON_AGENT_EXECUTION_ENDED = "agent_execution_ended"
COMPLETION_REASON_TIMEOUT = "timeout"
COMPLETION_REASON_SDK_SHUTDOWN = "sdk_shutdown"

VALID_COMPLETION_REASONS = frozenset(
    {
        COMPLETION_REASON_FRAMEWORK_TASK_FINISHED,
        COMPLETION_REASON_AGENT_EXECUTION_ENDED,
        COMPLETION_REASON_TIMEOUT,
        COMPLETION_REASON_SDK_SHUTDOWN,
    }
)
