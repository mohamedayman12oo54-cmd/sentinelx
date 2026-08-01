<?php

namespace App\Modules\Analysis\Infrastructure\Queue;

use App\Modules\Analysis\Application\AnalyzeObservationAction;
use App\Modules\Observation\Infrastructure\Persistence\ObservationRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Thin — delegates entirely to AnalyzeObservationAction. Retry/backoff
 * policy is an engineering default, not a frozen business rule — see
 * adr/ADR-003-ml-failure-retry-then-fail.md.
 *
 * The failed() hook is the single place that guarantees an Observation
 * never sits in PROCESSING forever after retries are exhausted — the
 * Action itself never calls markFailed() for a transport failure, so
 * without this hook a genuinely down ML Engine would leave the Observation
 * stuck. This is a safety net, not a duplicate: InvalidMlResponseException
 * is already resolved inside the Action without ever throwing, so failed()
 * never double-writes for that case.
 */
class AnalyzeObservationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    public function __construct(
        public readonly string $observationId,
        public readonly string $organizationId,
    ) {}

    public function handle(AnalyzeObservationAction $action): void
    {
        $action->handle($this->observationId, $this->organizationId);
    }

    public function failed(?Throwable $exception): void
    {
        app(ObservationRepository::class)->markFailed($this->observationId, now());
    }
}
