"""
HTTP API for the agent risk pipeline.

POST /v1/analyze  -- body: {"observation": {...}, "options": {...}}
                     matches the request contract designed earlier in this project.
                     options.debug=true returns the debug tier (full provenance);
                     default returns the public tier (evidence_type/description/
                     reference/confidence only).

GET  /health       -- liveness check.
"""
import os
import sys
import traceback
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from run_pipeline import run

app = FastAPI(title="Agent Risk Pipeline API", version="1.2.0")


class AnalyzeRequest(BaseModel):
    observation: Dict[str, Any]
    options: Dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/analyze")
def analyze(payload: AnalyzeRequest):
    obs = payload.observation

    if "context" not in obs:
        raise HTTPException(status_code=400, detail="observation.context is required")
    # FIXED (bug #3): previously only checked that the key existed, not that it
    # was actually a dict. A request like "context": "oops" or "context": null
    # passed validation and then blew up downstream (e.g. context.get(...)) with
    # an unhelpful AttributeError. Now the type is validated up front.
    if not isinstance(obs["context"], dict):
        raise HTTPException(status_code=400, detail="observation.context must be an object")
    if "events" not in obs or not isinstance(obs["events"], list):
        raise HTTPException(status_code=400, detail="observation.events must be a list")
    if "framework" not in obs["context"]:
        raise HTTPException(status_code=400, detail="observation.context.framework is required")

    for i, event in enumerate(obs["events"]):
        if "header" not in event or "event_type" not in event.get("header", {}):
            raise HTTPException(status_code=400, detail=f"events[{i}].header.event_type is required")
        if "payload" not in event:
            raise HTTPException(status_code=400, detail=f"events[{i}].payload is required")
        if not isinstance(event["payload"], dict):
            raise HTTPException(status_code=400, detail=f"events[{i}].payload must be an object")

    try:
        result = run(obs)
        if result is None:
            # Defensive guard: if run() ever again returns None (e.g. a future edit
            # reintroduces a code path with no return statement), fail loudly with a
            # clear 500 instead of crashing on result["public"] below with an opaque
            # TypeError that isn't even caught by this except block.
            raise RuntimeError("pipeline run() returned no result")

        debug = bool(payload.options.get("debug", False))
        # FIXED (bug #2): this used to sit *outside* the try/except, so if `result`
        # was ever None (as it was while bug #1 was present) this line raised
        # `TypeError: 'NoneType' object is not subscriptable` completely uncaught --
        # bypassing the structured "pipeline error" response entirely and surfacing
        # as a bare, undocumented Internal Server Error. It now lives inside the
        # try block so any failure here is caught and reported consistently.
        return result["debug"] if debug else result["public"]
    except Exception as e:
        # Full traceback goes to the server console (visible in your uvicorn
        # terminal) -- the caller only ever sees the exception type, not
        # internals.
        print("=== Pipeline error ===", file=sys.stderr)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"pipeline error: {type(e).__name__}") from e
