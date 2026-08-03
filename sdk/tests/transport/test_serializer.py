import json

from ases.observation.models import Event, Observation, ObservationMetadata
from ases.transport.serializer import serialize_observation


def test_serialize_observation_produces_valid_json():
    metadata = ObservationMetadata(
        sdk_version="1.0.0",
        environment="production",
        started_at="t1",
        completed_at="t2",
        completion_reason="agent_execution_ended",
        event_count=1,
    )
    observation = Observation(
        events=[Event(event_type="tool_call", payload={"tool": "search"}, timestamp="t1")],
        metadata=metadata,
    )
    serialized = serialize_observation(observation)
    parsed = json.loads(serialized)

    assert parsed["events"][0]["event_type"] == "tool_call"
    assert parsed["events"][0]["payload"] == {"tool": "search"}
    assert parsed["metadata"]["event_count"] == 1
    assert parsed["metadata"]["completion_reason"] == "agent_execution_ended"
