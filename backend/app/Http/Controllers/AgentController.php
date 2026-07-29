<?php

namespace App\Http\Controllers;

use App\Http\Resources\AgentResource;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    // GET /api/agent/me
    public function me(Request $request): AgentResource
    {
        return new AgentResource($request->user('agent'));
    }
}
