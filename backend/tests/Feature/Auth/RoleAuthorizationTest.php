<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

beforeEach(function () {
    Route::middleware(['auth:api', 'role:owner'])
        ->get('/api/__test/owner-only', fn () => response()->json(['ok' => true]));
});

// === HAPPY PATH ===

test('a user with the required role is allowed through', function () {
    $owner = User::factory()->owner()->create();
    $token = JWTAuth::fromUser($owner);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-only')
        ->assertOk();
});

// === FAILURE CASES ===

test('a user without the required role is denied with the generic 403 shape', function () {
    $member = User::factory()->create();
    $token = JWTAuth::fromUser($member);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-only')
        ->assertForbidden()
        ->assertExactJson(['error' => 'forbidden', 'message' => 'You do not have permission to perform this action.']);
});

test('an unauthenticated request never reaches the role check', function () {
    $this->getJson('/api/__test/owner-only')
        ->assertUnauthorized();
});
