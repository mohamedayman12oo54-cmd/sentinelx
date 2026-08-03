<?php

namespace App\Modules\Analysis\Infrastructure\MLClient;

use App\Modules\Analysis\Domain\Exceptions\MLCommunicationException;
use App\Modules\Observation\Infrastructure\Persistence\Observation;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * The plain HTTP wrapper around the ML Engine's /analyze endpoint — see
 * 04-ml-client-contract.md §1-3. Sends raw_ases_json unmodified, plus an
 * empty analysis_options object (no option fields are documented anywhere
 * yet — see §1). Never invents fields the frozen ML Contract doesn't name.
 */
class MLClient
{
    /**
     * @return array<string, mixed> the ML Engine's decoded JSON response body,
     *                              unvalidated — MLResponseValidator checks it next
     *
     * @throws MLCommunicationException
     */
    public function analyze(Observation $observation, string $requestId): array
    {
        try {
            $response = Http::baseUrl(config('services.ml_engine.url'))
                ->timeout(10)
                ->connectTimeout(3)
                // Correlates this specific Backend->ML call with both sides'
                // logs for it. Generated per analysis attempt by the caller
                // (AnalyzeObservationAction), not threaded from the original
                // observation-submission HTTP request — analysis runs later,
                // asynchronously, via a queued Job with no HTTP request
                // context of its own. See Phase 1.5 / OBS-001.
                ->withHeader('X-Request-Id', $requestId)
                ->when(
                    config('services.ml_engine.token'),
                    fn ($http, $token) => $http->withToken($token),
                )
                ->post('/analyze', [
                    // `id` is spread AFTER raw_ases_json, deliberately — so
                    // it always wins even if a payload ever contained a
                    // stray top-level `id` key. Observation validation is
                    // structural-only (ADR-002) and never forbids extra
                    // properties, so this can't be assumed away.
                    'observation' => [
                        ...$observation->raw_ases_json,
                        'id' => $observation->id,
                    ],
                    'analysis_options' => [],
                ]);
        } catch (ConnectionException $e) {
            throw new MLCommunicationException('Unable to reach the ML Engine.', previous: $e);
        }

        if ($response->failed()) {
            throw new MLCommunicationException("ML Engine returned an error response: HTTP {$response->status()}.");
        }

        return $response->json() ?? [];
    }
}
