<?php

use App\Models\Agent;
use App\Models\Alert;
use App\Models\ApiKey;
use App\Models\Observation;
use App\Models\Organization;
use App\Models\Prediction;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;

test('the database seeder runs end to end and every observation keeps its agent\'s organization', function () {
    Artisan::call('db:seed');

    expect(Organization::count())->toBeGreaterThan(0)
        ->and(User::count())->toBeGreaterThan(0)
        ->and(Agent::count())->toBeGreaterThan(0)
        ->and(ApiKey::count())->toBeGreaterThan(0)
        ->and(Observation::count())->toBeGreaterThan(0)
        ->and(Prediction::count())->toBeGreaterThan(0)
        ->and(Alert::count())->toBeGreaterThan(0);

    $mismatched = Observation::query()
        ->join('agents', 'agents.id', '=', 'observations.agent_id')
        ->whereColumn('observations.organization_id', '!=', 'agents.organization_id')
        ->count();

    expect($mismatched)->toBe(0);
});
