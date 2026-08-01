<?php

namespace App\Modules\Analysis\Application;

use App\Modules\Analysis\Domain\Exceptions\InvalidMlResponseException;
use App\Modules\Analysis\Domain\Exceptions\MLCommunicationException;
use App\Modules\Analysis\Domain\MLResponseValidator;
use App\Modules\Analysis\Infrastructure\MLClient\MLClient;
use App\Modules\Analysis\Infrastructure\Persistence\PredictionRepository;
use App\Modules\Observation\Infrastructure\Persistence\ObservationRepository;
use RuntimeException;

/**
 * Called by AnalyzeObservationJob for one already-claimed (PROCESSING)
 * Observation. Fetches it via Observation's own exposed contract, hands it
 * to the ML Engine unmodified, and durably records whatever comes back —
 * never deciding a verdict itself (01-overview.md §4).
 *
 * Two distinct failure kinds are handled differently, per
 * 04-ml-client-contract.md §4-5:
 *   - MLCommunicationException (transport failure) is left to propagate, so
 *     the Job's own retry/backoff can absorb a transient outage. Only once
 *     retries are exhausted does the Job's failed() hook call markFailed().
 *   - InvalidMlResponseException (contract violation) is caught here and
 *     resolved to markFailed() immediately, without retry — a malformed
 *     response is deterministic, so retrying would reproduce it identically.
 */
class AnalyzeObservationAction
{
    public function __construct(
        // Direct use of Observation's own concrete Repository, not just the
        // interface — this Action needs both the read contract method and
        // the markCompleted/markFailed write methods that live on it. Same
        // pattern already used for AgentRepository inside
        // ReceiveObservationAction (Stage 3).
        private readonly ObservationRepository $observations,
        private readonly MLClient $mlClient,
        private readonly MLResponseValidator $validator,
        private readonly PredictionRepository $predictions,
    ) {}

    /**
     * @throws MLCommunicationException
     */
    public function handle(string $observationId, string $organizationId): void
    {
        $observation = $this->observations->findByIdForOrganization($observationId, $organizationId);

        if (! $observation) {
            throw new RuntimeException("Observation {$observationId} was claimed for analysis but no longer exists.");
        }

        $response = $this->mlClient->analyze($observation);

        try {
            $this->validator->validate($response);
        } catch (InvalidMlResponseException) {
            $this->observations->markFailed($observationId, now());

            return;
        }

        $this->predictions->create([
            'observation_id' => $observation->id,
            'verdict' => $response['verdict'],
            'confidence' => $response['confidence'],
            'risk_score' => $response['risk_score'],
            'summary' => $response['summary'],
            'model_version' => $response['model_version'],
            'prediction_json' => $response,
            'analyzed_at' => now(),
        ]);

        $this->observations->markCompleted($observationId, now());
    }
}
