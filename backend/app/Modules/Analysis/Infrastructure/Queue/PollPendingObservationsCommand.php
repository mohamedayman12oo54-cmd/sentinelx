<?php

namespace App\Modules\Analysis\Infrastructure\Queue;

use App\Modules\Analysis\Application\ClaimPendingObservationsAction;
use Illuminate\Console\Command;

/**
 * Tier 1 of the pipeline (03-processing-pipeline.md §3) — thin, delegates
 * entirely to ClaimPendingObservationsAction. Scheduled in routes/console.php.
 */
class PollPendingObservationsCommand extends Command
{
    protected $signature = 'analysis:poll-pending-observations {--limit=10}';

    protected $description = 'Claims a batch of PENDING Observations and dispatches an analysis Job for each.';

    public function handle(ClaimPendingObservationsAction $action): int
    {
        $claimed = $action->handle((int) $this->option('limit'));

        $this->info("Claimed {$claimed} Observation(s) for analysis.");

        return self::SUCCESS;
    }
}
