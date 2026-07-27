<?php

use App\Models\Agent;
use App\Models\Alert;
use App\Models\ApiKey;
use App\Models\Company;
use App\Models\Observation;
use App\Models\Prediction;
use App\Models\User;
use Illuminate\Database\QueryException;

// Every foreign key in the schema uses ON DELETE RESTRICT — no CASCADE,
// no SET NULL. See backend/docs/database/02-schema/relationships.md.

test('a company cannot be deleted while it has users', function () {
    $user = User::factory()->create();

    expect(fn () => $user->company->delete())->toThrow(QueryException::class);
});

test('a company cannot be deleted while it has agents', function () {
    $agent = Agent::factory()->create();

    expect(fn () => $agent->company->delete())->toThrow(QueryException::class);
});

test('an agent cannot be deleted while it has api keys', function () {
    $apiKey = ApiKey::factory()->create();

    expect(fn () => $apiKey->agent->delete())->toThrow(QueryException::class);
});

test('an agent cannot be deleted while it has observations', function () {
    $observation = Observation::factory()->create();

    expect(fn () => $observation->agent->delete())->toThrow(QueryException::class);
});

test('an observation cannot be deleted while it has a prediction', function () {
    $prediction = Prediction::factory()->create();

    expect(fn () => $prediction->observation->delete())->toThrow(QueryException::class);
});

test('a prediction cannot be deleted while it has an alert', function () {
    $alert = Alert::factory()->create();

    expect(fn () => $alert->prediction->delete())->toThrow(QueryException::class);
});

test('the full dependency chain can be built end to end', function () {
    $company = Company::factory()->create();
    $agent = Agent::factory()->for($company)->create();
    $apiKey = ApiKey::factory()->for($agent)->create();
    $observation = Observation::factory()->for($agent)->for($company)->completed()->create();
    $prediction = Prediction::factory()->malicious()->for($observation)->create();
    $alert = Alert::factory()->for($prediction)->create();

    expect($agent->company->is($company))->toBeTrue()
        ->and($apiKey->agent->is($agent))->toBeTrue()
        ->and($observation->agent->is($agent))->toBeTrue()
        ->and($observation->company->is($company))->toBeTrue()
        ->and($prediction->observation->is($observation))->toBeTrue()
        ->and($alert->prediction->is($prediction))->toBeTrue();
});
