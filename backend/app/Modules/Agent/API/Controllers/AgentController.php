<?php

namespace App\Modules\Agent\API\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Agent\Presentation\AgentResource;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    // GET /api/agent/me
    public function me(Request $request): AgentResource
    {
        return new AgentResource($request->user('agent'));
    }
}
