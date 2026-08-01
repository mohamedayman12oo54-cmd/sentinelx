<?php

namespace App\Modules\Observation\Infrastructure\Persistence;

use App\Modules\Observation\Application\Contracts\ObservationLookupContract;
use App\Modules\Observation\Domain\AnalysisStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

/**
 * The only place inside the Observation module that touches the
 * `observations` table directly. Every read is scoped to organization_id —
 * see 06-authorization.md §4 ("Scoped Queries", 404 not 403 for
 * cross-tenant). The three mark*() methods are exposed now for Analysis
 * (Stage 4) to consume later — see 05-cross-module-boundaries.md §2.
 */
class ObservationRepository implements ObservationLookupContract
{
    public function create(array $attributes): Observation
    {
        return Observation::create($attributes);
    }

    public function findById(string $observationId, string $organizationId): ?Observation
    {
        return Observation::query()
            ->where('organization_id', $organizationId)
            ->where('id', $observationId)
            ->first();
    }

    public function listForOrganization(
        string $organizationId,
        ?string $agentId,
        ?AnalysisStatus $status,
        int $perPage,
        int $page,
    ): LengthAwarePaginator {
        return Observation::query()
            ->where('organization_id', $organizationId)
            ->when($agentId, fn ($query) => $query->where('agent_id', $agentId))
            ->when($status, fn ($query) => $query->where('analysis_status', $status))
            ->orderByDesc('received_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    /**
     * Not yet called by anything — Analysis (Stage 4) will call this once a
     * queued Observation begins processing. See 05-cross-module-boundaries.md §2.
     */
    public function markProcessing(string $observationId): void
    {
        Observation::query()->where('id', $observationId)->update([
            'analysis_status' => AnalysisStatus::Processing,
            'processing_started_at' => now(),
        ]);
    }

    /**
     * Not yet called by anything — Analysis (Stage 4) will call this once
     * ML analysis completes successfully. See 05-cross-module-boundaries.md §2.
     */
    public function markCompleted(string $observationId, Carbon $processedAt): void
    {
        Observation::query()->where('id', $observationId)->update([
            'analysis_status' => AnalysisStatus::Completed,
            'processed_at' => $processedAt,
        ]);
    }

    /**
     * Not yet called by anything — Analysis (Stage 4) will call this if ML
     * analysis fails. See 05-cross-module-boundaries.md §2.
     */
    public function markFailed(string $observationId, Carbon $processedAt): void
    {
        Observation::query()->where('id', $observationId)->update([
            'analysis_status' => AnalysisStatus::Failed,
            'processed_at' => $processedAt,
        ]);
    }

    public function findByIdForOrganization(string $observationId, string $organizationId): ?Observation
    {
        return $this->findById($observationId, $organizationId);
    }
}
