<?php

namespace App\Modules\Observation\Presentation;

use App\Modules\Observation\Infrastructure\Persistence\Observation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full detail view — GET /observations/{id}. Matches 07-api-contract.md §3
 * exactly, including raw_ases_json (unlike ObservationSummaryResource).
 *
 * `prediction` is hardcoded null — there is no Prediction module yet.
 * See adr/ADR-003-prediction-composition-deferred.md. This is not a TODO;
 * Stage 4 (Analysis) owns populating this field, by composing on top of
 * this module's ObservationLookupContract — nothing about this class
 * changes when that happens.
 *
 * @mixin Observation
 */
class ObservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agent_id' => $this->agent_id,
            'organization_id' => $this->organization_id,
            'analysis_status' => $this->analysis_status,
            'raw_ases_json' => $this->raw_ases_json,
            'received_at' => $this->received_at,
            'processing_started_at' => $this->processing_started_at,
            'processed_at' => $this->processed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'prediction' => null,
        ];
    }
}
