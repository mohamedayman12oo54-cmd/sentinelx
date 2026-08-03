"""End-to-end integration test: emit() -> Collector -> Builder -> Validator
-> Transport Queue -> Worker -> (mocked) API Client. Only the network call
itself is mocked — every other component in the Golden Chain runs for real.
"""

import time
from unittest.mock import patch

from ases import ASES
from ases.adapters.generic.adapter import GenericAdapter


def test_end_to_end_single_execution():
    sent_payloads = []

    def fake_send(self, serialized):
        sent_payloads.append(serialized)
        return True

    with patch("ases.transport.client.APIClient.send", fake_send):
        sdk = ASES(api_key="ases_test_key")
        adapter = GenericAdapter()
        sdk.attach(adapter)
        sdk.start()

        adapter.emit("tool_call", {"tool": "search", "query": "AI security news"})
        adapter.emit("llm_call", {"model": "gpt-4o"})
        adapter.complete()

        time.sleep(1.5)  # let the background Worker drain the Queue
        sdk.stop()

    assert len(sent_payloads) == 1
    assert '"tool_call"' in sent_payloads[0]
    assert '"llm_call"' in sent_payloads[0]


def test_end_to_end_concurrent_executions_produce_separate_observations():
    sent_payloads = []

    def fake_send(self, serialized):
        sent_payloads.append(serialized)
        return True

    with patch("ases.transport.client.APIClient.send", fake_send):
        sdk = ASES(api_key="ases_test_key")
        adapter = GenericAdapter()
        sdk.attach(adapter)
        sdk.start()

        exec_a = adapter.begin_execution()
        exec_b = adapter.begin_execution()
        exec_a.emit("tool_call", {"tool": "search"})
        exec_b.emit("api_call", {"endpoint": "/invoices"})
        exec_a.complete()
        exec_b.complete()

        time.sleep(1.5)
        sdk.stop()

    assert len(sent_payloads) == 2


def test_start_is_idempotent_and_stop_flushes_on_shutdown():
    sent_payloads = []

    def fake_send(self, serialized):
        sent_payloads.append(serialized)
        return True

    with patch("ases.transport.client.APIClient.send", fake_send):
        sdk = ASES(api_key="ases_test_key")
        adapter = GenericAdapter()
        sdk.attach(adapter)
        sdk.start()
        sdk.start()  # must be a no-op, not an error

        # Never explicitly completed — stop() must flush it via the
        # Collector's sdk_shutdown path (09-observation-lifecycle.md).
        adapter.emit("tool_call", {"tool": "search"})
        sdk.stop()

    assert len(sent_payloads) == 1
    assert '"completion_reason":"sdk_shutdown"' in sent_payloads[0]
