"""API Client — the only component that actually knows how to speak HTTP:
authentication, requests, retry policy, endpoint management
(10-transport-layer.md, section 7).

Built on Python's standard library (urllib.request) rather than a
third-party HTTP library, consistent with the Dependency Policy in
12-packaging-and-distribution.md ("every dependency must have a clear,
articulable reason for existing") — a low-volume POST with a short timeout
does not need more than the standard library already provides. This keeps
the shipped package at zero third-party runtime dependencies.

!! ENDPOINT / AUTH ASSUMPTION — CONFIRM AGAINST THE REAL LARAVEL BACKEND !!

The exact request shape below — POST {endpoint}{OBSERVATIONS_PATH} with an
`Authorization: Bearer <api_key>` header, expecting HTTP 202 on success — is
inferred from 01-overview.md's illustrative `POST /observations` example and
the Bearer-token pattern described for company-level authentication. Neither
was confirmed against the real routes/api.php or auth middleware. If the
real contract differs (a different header name, a different success status,
a versioned path), this file — and only this file — needs to change; see
constants.py for the path/host defaults it reads.
"""

from __future__ import annotations

import time
import urllib.error
import urllib.request
from typing import Dict

from ases.config.settings import Settings
from ases.shared.constants import (
    HTTP_REQUEST_TIMEOUT_SECONDS,
    OBSERVATIONS_PATH,
    SDK_NAME,
    SDK_VERSION,
    TRANSPORT_MAX_RETRIES,
)
from ases.shared.logger import get_logger


class APIClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._logger = get_logger("transport.client")

    def send(self, serialized_observation: str) -> bool:
        """Attempt delivery with up to TRANSPORT_MAX_RETRIES retries.

        Returns True on success (HTTP 202), False once retries are
        exhausted. Never raises — this method is the concrete enforcement
        point for ADR-004's "ASES must never be the reason an Agent fails."
        """
        url = self._settings.endpoint.rstrip("/") + OBSERVATIONS_PATH
        data = serialized_observation.encode("utf-8")
        headers = self._build_headers()

        attempt = 0
        while attempt <= TRANSPORT_MAX_RETRIES:
            attempt += 1
            request = urllib.request.Request(url, data=data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(request, timeout=HTTP_REQUEST_TIMEOUT_SECONDS) as response:
                    status = response.getcode()
                    if status == 202:
                        return True
                    self._logger.warning(
                        "SentinelX responded with unexpected status %s (attempt %d/%d).",
                        status, attempt, TRANSPORT_MAX_RETRIES + 1,
                    )
            except urllib.error.HTTPError as exc:
                self._logger.warning(
                    "SentinelX rejected the Observation: HTTP %s (attempt %d/%d).",
                    exc.code, attempt, TRANSPORT_MAX_RETRIES + 1,
                )
                if 400 <= exc.code < 500:
                    # A 4xx (bad payload, bad auth, validation failure) will
                    # not succeed on retry — fail fast rather than burning
                    # the remaining retry budget on a request that cannot
                    # change outcome.
                    return False
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                self._logger.warning(
                    "Network error delivering Observation: %s (attempt %d/%d).",
                    exc, attempt, TRANSPORT_MAX_RETRIES + 1,
                )

            if attempt <= TRANSPORT_MAX_RETRIES:
                # Simple bounded backoff: 1s, 2s, 4s, capped at 8s.
                time.sleep(min(2 ** (attempt - 1), 8))

        return False

    def _build_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._settings.api_key}",
            "User-Agent": f"{SDK_NAME}-python/{SDK_VERSION}",
            "X-ASES-Environment": self._settings.environment,
        }
