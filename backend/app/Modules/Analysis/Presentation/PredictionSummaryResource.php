<?php

namespace App\Modules\Analysis\Presentation;

use App\Modules\Analysis\Infrastructure\Persistence\Prediction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The `prediction` field embedded inside GET /observations/{id} — see
 * 07-api-contract.md §1. Deliberately exposes only the five promoted
 * columns plus id/analyzed_at, never the full prediction_json blob
 * (Evidence, Reasons, Models) — see that file's note on Dashboard's future
 * role for the full detail.
 *
 * @mixin Prediction
 */
class PredictionSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'verdict' => $this->verdict,
            'confidence' => $this->confidence,
            'risk_score' => $this->risk_score,
            'summary' => $this->summary,
            'model_version' => $this->model_version,
            'analyzed_at' => $this->analyzed_at,
        ];
    }
}
