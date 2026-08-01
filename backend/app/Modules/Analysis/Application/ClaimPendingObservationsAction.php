<?php

namespace App\Modules\Analysis\Application;

use App\Modules\Analysis\Infrastructure\Queue\AnalyzeObservationJob;
use App\Modules\Observation\Infrastructure\Persistence\ObservationRepository;

/**
 * Called by PollPendingObservationsCommand. Claims a batch of PENDING
 * Observations (atomically flipped to PROCESSING as part of the claim
 * itself — see ObservationRepository::claimNextPendingBatch()) and
 * dispatches one Queue Job per claimed Observation. See
 * 03-processing-pipeline.md §3-4.
 */
class ClaimPendingObservationsAction
{
    public function __construct(
        // Direct use of Observation's own concrete Repository — the exact
        // same cross-module pattern as touchLastSeen() and
        // AnalyzeObservationAction above, applied a third time.
        private readonly ObservationRepository $observations,
    ) {}

    public function handle(int $limit): int
    {
        $claimed = $this->observations->claimNextPendingBatch($limit);

        foreach ($claimed as $observation) {
            AnalyzeObservationJob::dispatch($observation->id, $observation->organization_id);
        }

        return count($claimed);
    }
}
