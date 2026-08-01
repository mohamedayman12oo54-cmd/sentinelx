<?php

use App\Modules\Analysis\Infrastructure\Queue\AnalyzeObservationJob;
use App\Modules\Observation\Domain\AnalysisStatus;
use App\Modules\Observation\Infrastructure\Persistence\Observation;
use Illuminate\Support\Facades\Bus;

// === HAPPY PATH ===

test('the poller claims PENDING observations and dispatches one job per claimed observation', function () {
    Bus::fake();

    $observations = Observation::factory(3)->create();

    $this->artisan('analysis:poll-pending-observations')->assertSuccessful();

    Bus::assertDispatchedTimes(AnalyzeObservationJob::class, 3);

    foreach ($observations as $observation) {
        expect($observation->fresh()->analysis_status)->toBe(AnalysisStatus::Processing);
    }
});

// === EDGE CASE ===

test('the poller respects the --limit option', function () {
    Bus::fake();

    Observation::factory(5)->create();

    $this->artisan('analysis:poll-pending-observations', ['--limit' => 2])->assertSuccessful();

    Bus::assertDispatchedTimes(AnalyzeObservationJob::class, 2);
});

test('the poller dispatches nothing when there is no PENDING work', function () {
    Bus::fake();

    Observation::factory()->completed()->create();

    $this->artisan('analysis:poll-pending-observations')->assertSuccessful();

    Bus::assertNotDispatched(AnalyzeObservationJob::class);
});
