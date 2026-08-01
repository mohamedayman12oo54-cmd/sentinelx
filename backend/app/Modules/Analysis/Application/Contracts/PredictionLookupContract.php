<?php

namespace App\Modules\Analysis\Application\Contracts;

use App\Modules\Analysis\Infrastructure\Persistence\Prediction;

/**
 * The read-only surface Alert (Stage 5) will consume — exposed now, called
 * by nobody yet, exactly as ObservationLookupContract was in Stage 3. See
 * 05-cross-module-boundaries.md §2. Also consumed within this same request
 * cycle by Observation's own ObservationController@show, to complete the
 * `prediction` field left null since Stage 3 — see 07-api-contract.md §2.
 */
interface PredictionLookupContract
{
    public function findByObservationId(string $observationId): ?Prediction;
}
