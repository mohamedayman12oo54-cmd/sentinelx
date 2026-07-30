<?php

use App\Modules\Agent\Domain\AgentStatus;
use App\Modules\Agent\Infrastructure\Persistence\Agent;
use App\Modules\Authentication\ApiKey\Domain\ApiKeyStatus;
use App\Modules\Authentication\ApiKey\Infrastructure\Persistence\ApiKey;

function createAgentWithKey(string $rawKey, array $agentState = [], array $keyState = []): Agent
{
    $agent = Agent::factory()->create($agentState);

    ApiKey::factory()->for($agent)->create([
        'key_hash' => hash('sha256', $rawKey),
        ...$keyState,
    ]);

    return $agent;
}

// === HAPPY PATH ===

test('a valid, active API key authenticates the agent', function () {
    $agent = createAgentWithKey('a-valid-raw-secret');

    $response = $this->withHeader('X-API-Key', 'a-valid-raw-secret')
        ->getJson('/api/agent/me');

    $response->assertOk()->assertJsonPath('data.id', $agent->id);
});

test('successful authentication touches last_used_at and last_seen_at', function () {
    $agent = createAgentWithKey('a-valid-raw-secret', ['last_seen_at' => null]);

    $this->withHeader('X-API-Key', 'a-valid-raw-secret')->getJson('/api/agent/me')->assertOk();

    expect($agent->fresh()->last_seen_at)->not->toBeNull()
        ->and($agent->apiKeys()->first()->last_used_at)->not->toBeNull();
});

// === FAILURE CASES — all must return the exact same generic 401 shape ===

test('a request with no API key is rejected', function () {
    $this->getJson('/api/agent/me')
        ->assertUnauthorized()
        ->assertExactJson(['error' => 'authentication_failed', 'message' => 'Authentication failed.']);
});

test('an unknown API key is rejected', function () {
    $this->withHeader('X-API-Key', 'not-a-real-key')
        ->getJson('/api/agent/me')
        ->assertUnauthorized()
        ->assertExactJson(['error' => 'authentication_failed', 'message' => 'Authentication failed.']);
});

test('a revoked API key is rejected', function () {
    createAgentWithKey('a-revoked-secret', keyState: ['status' => ApiKeyStatus::Revoked]);

    $this->withHeader('X-API-Key', 'a-revoked-secret')
        ->getJson('/api/agent/me')
        ->assertUnauthorized()
        ->assertExactJson(['error' => 'authentication_failed', 'message' => 'Authentication failed.']);
});

test('an expired API key is rejected', function () {
    createAgentWithKey('an-expired-secret', keyState: ['expires_at' => now()->subDay()]);

    $this->withHeader('X-API-Key', 'an-expired-secret')
        ->getJson('/api/agent/me')
        ->assertUnauthorized()
        ->assertExactJson(['error' => 'authentication_failed', 'message' => 'Authentication failed.']);
});

test('a valid key belonging to an archived agent is rejected', function () {
    createAgentWithKey('a-key-for-archived-agent', ['status' => AgentStatus::Archived]);

    $this->withHeader('X-API-Key', 'a-key-for-archived-agent')
        ->getJson('/api/agent/me')
        ->assertUnauthorized()
        ->assertExactJson(['error' => 'authentication_failed', 'message' => 'Authentication failed.']);
});

test('an active key for a different agent does not authenticate as another agent', function () {
    createAgentWithKey('agent-one-secret');
    $agentTwo = createAgentWithKey('agent-two-secret');

    $response = $this->withHeader('X-API-Key', 'agent-two-secret')->getJson('/api/agent/me');

    $response->assertOk()->assertJsonPath('data.id', $agentTwo->id);
});
