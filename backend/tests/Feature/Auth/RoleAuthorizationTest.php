<?php

use App\Modules\Authentication\Identity\Infrastructure\Persistence\User;
use Illuminate\Support\Facades\Route;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

beforeEach(function () {
    Route::middleware(['auth:api', 'role:owner'])
        ->get('/api/__test/owner-only', fn () => response()->json(['ok' => true]));

    Route::middleware(['auth:api', 'role:owner,admin'])
        ->get('/api/__test/owner-or-admin', fn () => response()->json(['ok' => true]));
});

// === HAPPY PATH ===

test('a user with the required role is allowed through', function () {
    $owner = User::factory()->owner()->create();
    $token = JWTAuth::fromUser($owner);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-only')
        ->assertOk();
});

test('an admin is allowed through a route that lists admin among the allowed roles', function () {
    $admin = User::factory()->admin()->create();
    $token = JWTAuth::fromUser($admin);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-or-admin')
        ->assertOk();
});

test('an admin is denied on a route restricted to owner only', function () {
    $admin = User::factory()->admin()->create();
    $token = JWTAuth::fromUser($admin);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-only')
        ->assertForbidden()
        ->assertExactJson(['error' => 'forbidden', 'message' => 'You do not have permission to perform this action.']);
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

test('a member is denied on a route restricted to owner or admin', function () {
    $member = User::factory()->create();
    $token = JWTAuth::fromUser($member);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/__test/owner-or-admin')
        ->assertForbidden()
        ->assertExactJson(['error' => 'forbidden', 'message' => 'You do not have permission to perform this action.']);
});

test('an unauthenticated request never reaches the role check', function () {
    $this->getJson('/api/__test/owner-only')
        ->assertUnauthorized();
});
