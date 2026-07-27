<?php

use App\Enums\AgentStatus;
use App\Models\Agent;
use App\Models\Company;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\QueryException;

// === HAPPY PATH ===

test('an agent belongs to a company and defaults to ACTIVE', function () {
    $agent = Agent::factory()->create();

    expect($agent->status)->toBe(AgentStatus::Active)
        ->and($agent->company)->toBeInstanceOf(Company::class);
});

test('an agent can be archived', function () {
    $agent = Agent::factory()->archived()->create();

    expect($agent->status)->toBe(AgentStatus::Archived);
});

// === CONSTRAINTS ===

test('agent name must be unique within a company', function () {
    $company = Company::factory()->create();
    Agent::factory()->for($company)->create(['name' => 'Support Agent']);

    expect(fn () => Agent::factory()->for($company)->create(['name' => 'Support Agent']))
        ->toThrow(QueryException::class);
});

test('two different companies may each have an agent with the same name', function () {
    Agent::factory()->create(['name' => 'Support Agent']);
    $second = Agent::factory()->create(['name' => 'Support Agent']);

    expect($second->exists)->toBeTrue();
});

// === RELATIONSHIPS ===

test('an agent has many api keys and observations', function () {
    $agent = Agent::factory()->create();

    expect($agent->apiKeys())->toBeInstanceOf(HasMany::class)
        ->and($agent->observations())->toBeInstanceOf(HasMany::class);
});
