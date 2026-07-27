<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\QueryException;

// === HAPPY PATH ===

test('a user belongs to a company and defaults to MEMBER/ACTIVE', function () {
    $company = Company::factory()->create();
    $user = User::factory()->for($company)->create();

    expect($user->company->is($company))->toBeTrue()
        ->and($user->role)->toBe(UserRole::Member)
        ->and($user->status)->toBe(UserStatus::Active);
});

test('password_hash is hidden from array/JSON serialization', function () {
    $user = User::factory()->create();

    expect($user->toArray())->not->toHaveKey('password_hash');
});

test('authentication reads the password from password_hash', function () {
    $user = User::factory()->create(['password_hash' => 'a-hashed-value']);

    expect($user->getAuthPassword())->toBe('a-hashed-value');
});

// === CONSTRAINTS ===

test('email is unique across the whole platform, not just per company', function () {
    User::factory()->create(['email' => 'duplicate@example.com']);

    expect(fn () => User::factory()->create(['email' => 'duplicate@example.com']))
        ->toThrow(QueryException::class);
});

test('a user cannot be created without a company_id', function () {
    expect(fn () => User::factory()->create(['company_id' => null]))
        ->toThrow(QueryException::class);
});

// === RELATIONSHIPS ===

test('a user belongs to exactly one company', function () {
    $user = User::factory()->create();

    expect($user->company())->toBeInstanceOf(BelongsTo::class);
});
