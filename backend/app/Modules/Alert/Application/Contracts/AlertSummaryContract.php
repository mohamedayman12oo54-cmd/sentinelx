<?php

namespace App\Modules\Alert\Application\Contracts;

/**
 * The read-only surface Dashboard (Stage 6) will consume — exposed now,
 * called by nobody yet, exactly as ObservationLookupContract and
 * PredictionLookupContract were before their consumers existed. See
 * 05-cross-module-boundaries.md §3. Returns raw counts only — this module
 * never formats data for widget/chart display; that's Dashboard's job.
 */
interface AlertSummaryContract
{
    /**
     * @return array{OPEN: int, ACKNOWLEDGED: int, RESOLVED: int}
     */
    public function countByStatusForOrganization(string $organizationId): array;
}
