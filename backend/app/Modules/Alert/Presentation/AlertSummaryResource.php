<?php

namespace App\Modules\Alert\Presentation;

use App\Modules\Alert\Infrastructure\Persistence\Alert;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * List view — GET /alerts. Deliberately minimal, excluding the related
 * Observation/Prediction detail — same list-vs-detail pattern already used
 * in Agent and Observation. See 06-api-contract.md §1.
 *
 * @mixin Alert
 */
class AlertSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'prediction_id' => $this->prediction_id,
            'severity' => $this->severity,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
