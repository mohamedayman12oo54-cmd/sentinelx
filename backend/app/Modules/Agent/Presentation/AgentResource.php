<?php

namespace App\Modules\Agent\Presentation;

use App\Modules\Agent\Infrastructure\Persistence\Agent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Agent
 */
class AgentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'type' => 'AGENT',
            'name' => $this->name,
            'framework' => $this->framework,
            'status' => $this->status,
            'last_seen_at' => $this->last_seen_at,
        ];
    }
}
