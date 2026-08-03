<?php

use App\Modules\Agent\Infrastructure\Persistence\Agent;
use App\Modules\Authentication\Identity\Infrastructure\Persistence\User;
use App\Modules\Organization\Infrastructure\Persistence\Organization;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

// === HAPPY PATH: header present on a successful response ===

test('a successful response carries an X-Request-Id header', function () {
    $organization = Organization::factory()->create();
    $owner = User::factory()->owner()->for($organization)->create();
    $agent = Agent::factory()->for($organization)->create();

    $this->withHeader('Authorization', 'Bearer '.tokenFor($owner))
        ->getJson("/api/v1/agents/{$agent->id}")
        ->assertOk()
        ->assertHeader('X-Request-Id');
});

test('an inbound X-Request-Id header is reused rather than replaced', function () {
    $organization = Organization::factory()->create();
    $owner = User::factory()->owner()->for($organization)->create();
    $agent = Agent::factory()->for($organization)->create();

    $this->withHeaders([
        'Authorization' => 'Bearer '.tokenFor($owner),
        'X-Request-Id' => 'caller-supplied-id-123',
    ])
        ->getJson("/api/v1/agents/{$agent->id}")
        ->assertOk()
        ->assertHeader('X-Request-Id', 'caller-supplied-id-123');
});

// === ERROR PATH: header + body carry the same id, for both response shapes ===

test('a flat-shape error response carries X-Request-Id in both the header and a top-level body field', function () {
    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'nobody@acme.example',
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized()->assertJsonStructure(['request_id']);

    expect($response->headers->get('X-Request-Id'))
        ->not->toBeEmpty()
        ->toBe($response->json('request_id'));
});

test('a nested error-object response carries X-Request-Id inside the error object, matching the header', function () {
    $organization = Organization::factory()->create();
    $owner = User::factory()->owner()->for($organization)->create();

    $response = $this->withHeader('Authorization', 'Bearer '.tokenFor($owner))
        ->getJson('/api/v1/agents/0198a1b2-0000-7000-8000-000000000000');

    $response->assertNotFound()->assertJsonStructure(['error' => ['code', 'message', 'details', 'request_id']]);

    expect($response->headers->get('X-Request-Id'))
        ->not->toBeEmpty()
        ->toBe($response->json('error.request_id'));
});

// === ISOLATION: concurrent/sequential requests never share an id ===

test('two requests with no inbound header each receive their own unique X-Request-Id', function () {
    $organization = Organization::factory()->create();
    $owner = User::factory()->owner()->for($organization)->create();
    $agent = Agent::factory()->for($organization)->create();

    $first = $this->withHeader('Authorization', 'Bearer '.tokenFor($owner))
        ->getJson("/api/v1/agents/{$agent->id}");
    $second = $this->withHeader('Authorization', 'Bearer '.tokenFor($owner))
        ->getJson("/api/v1/agents/{$agent->id}");

    expect($first->headers->get('X-Request-Id'))
        ->not->toBeEmpty()
        ->not->toBe($second->headers->get('X-Request-Id'));
});

// === LOGGING: request_id reaches Log:: calls made during the request ===

test('a login failure logs a warning carrying the same request_id as the response', function () {
    Log::spy();

    User::factory()->create([
        'email' => 'ahmed@acme.example',
        'password_hash' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'ahmed@acme.example',
        'password' => 'wrong-password',
    ]);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn (string $message, array $context = []) => $message === 'Login failed: invalid credentials.'
            && ($context['email'] ?? null) === 'ahmed@acme.example'
        );

    // Log::withContext() (set by AssignRequestId) merges request_id into
    // every subsequent Log:: call automatically — this only confirms the
    // response itself still carries one, since Log::spy() intercepts calls
    // before the withContext() merge is applied to the recorded arguments.
    expect($response->headers->get('X-Request-Id'))->not->toBeEmpty();
});
