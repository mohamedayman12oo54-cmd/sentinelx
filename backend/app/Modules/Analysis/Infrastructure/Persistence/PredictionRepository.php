<?php

namespace App\Modules\Analysis\Infrastructure\Persistence;

use App\Modules\Analysis\Application\Contracts\PredictionLookupContract;

/**
 * The only place inside the Analysis module that touches the `predictions`
 * table directly. A Prediction is written exactly once, ever, per
 * Observation (02-domain.md §5) — there is no update()/delete() method here,
 * deliberately.
 */
class PredictionRepository implements PredictionLookupContract
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Prediction
    {
        return Prediction::create($attributes);
    }

    public function findByObservationId(string $observationId): ?Prediction
    {
        return Prediction::query()
            ->where('observation_id', $observationId)
            ->first();
    }

    public function findById(string $predictionId): ?Prediction
    {
        return Prediction::find($predictionId);
    }
}
