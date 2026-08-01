<?php

namespace App\Modules\Alert\Presentation;

use App\Modules\Alert\Application\AlertDetail;
use App\Modules\Analysis\Presentation\PredictionSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Single detail view — GET /alerts/{id}. Composes the Alert with its
 * related Prediction (reusing Analysis's own PredictionSummaryResource —
 * same 5-promoted-field shape already used inside
 * GET /observations/{id}) and a minimal Observation embed. See
 * 06-api-contract.md §2.
 *
 * @mixin AlertDetail
 */
class AlertDetailResource extends JsonResource
{
    public function __construct(private readonly AlertDetail $detail)
    {
        parent::__construct($detail);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $alert = $this->detail->alert;
        $observation = $this->detail->observation;

        return [
            'id' => $alert->id,
            'severity' => $alert->severity,
            'status' => $alert->status,
            'acknowledged_at' => $alert->acknowledged_at,
            'acknowledged_by' => $alert->acknowledged_by,
            'resolved_at' => $alert->resolved_at,
            'resolved_by' => $alert->resolved_by,
            'created_at' => $alert->created_at,
            'updated_at' => $alert->updated_at,
            'prediction' => new PredictionSummaryResource($this->detail->prediction),
            'observation' => [
                'id' => $observation->id,
                'agent_id' => $observation->agent_id,
                'received_at' => $observation->received_at,
            ],
        ];
    }
}
