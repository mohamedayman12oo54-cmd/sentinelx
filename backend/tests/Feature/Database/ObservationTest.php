<?php

use App\Modules\Agent\Infrastructure\Persistence\Agent;
use App\Modules\Observation\Domain\AnalysisStatus;
use App\Modules\Observation\Infrastructure\Persistence\Observation;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

// === HAPPY PATH ===

test('an observation defaults to PENDING and stores raw_ases_json as an array', function () {
    $observation = Observation::factory()->create();

    expect($observation->analysis_status)->toBe(AnalysisStatus::Pending)
        ->and($observation->raw_ases_json)->toBeArray()
        ->and($observation->raw_ases_json)->toHaveKeys(['context', 'events', 'metadata']);
});

test('an observation can be marked completed', function () {
    $observation = Observation::factory()->completed()->create();

    expect($observation->analysis_status)->toBe(AnalysisStatus::Completed)
        ->and($observation->processed_at)->not->toBeNull();
});

// === BUSINESS RULE: organization_id denormalization (ADR-005) ===

test('organization_id always matches the owning agent\'s organization', function () {
    $agent = Agent::factory()->create();
    $observation = Observation::factory()->for($agent)->create();

    expect($observation->organization_id)->toBe($agent->organization_id);
});

// === RELATIONSHIPS ===

test('an observation belongs to an organization and an agent, and may have one prediction', function () {
    $observation = Observation::factory()->create();

    expect($observation->organization())->toBeInstanceOf(BelongsTo::class)
        ->and($observation->agent())->toBeInstanceOf(BelongsTo::class)
        ->and($observation->prediction())->toBeInstanceOf(HasOne::class)
        ->and($observation->prediction)->toBeNull();
});
