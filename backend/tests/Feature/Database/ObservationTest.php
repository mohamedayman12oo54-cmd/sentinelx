<?php

use App\Enums\AnalysisStatus;
use App\Models\Agent;
use App\Models\Observation;
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

// === BUSINESS RULE: company_id denormalization (ADR-005) ===

test('company_id always matches the owning agent\'s company', function () {
    $agent = Agent::factory()->create();
    $observation = Observation::factory()->for($agent)->create();

    expect($observation->company_id)->toBe($agent->company_id);
});

// === RELATIONSHIPS ===

test('an observation belongs to a company and an agent, and may have one prediction', function () {
    $observation = Observation::factory()->create();

    expect($observation->company())->toBeInstanceOf(BelongsTo::class)
        ->and($observation->agent())->toBeInstanceOf(BelongsTo::class)
        ->and($observation->prediction())->toBeInstanceOf(HasOne::class)
        ->and($observation->prediction)->toBeNull();
});
