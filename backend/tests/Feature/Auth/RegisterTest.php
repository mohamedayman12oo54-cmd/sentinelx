<?php

use App\Enums\UserRole;
use App\Models\Company;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

// === HAPPY PATH ===

test('registering creates a company and an owner user, and sends a verification email', function () {
    Notification::fake();

    $response = $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Ahmed Owner',
        'email' => 'ahmed@acme.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated();

    $user = User::where('email', 'ahmed@acme.example')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Owner)
        ->and($user->email_verified_at)->toBeNull();

    $company = Company::where('name', 'Acme Security')->first();
    expect($company)->not->toBeNull()
        ->and($user->company_id)->toBe($company->id);

    Notification::assertSentTo($user, VerifyEmail::class);
});

test('registration response never exposes password_hash', function () {
    $response = $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Ahmed Owner',
        'email' => 'ahmed@acme.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()->assertJsonMissing(['password_hash']);
});

// === VALIDATION / EDGE CASES ===

test('registration fails when the email is already taken', function () {
    User::factory()->create(['email' => 'taken@acme.example']);

    $response = $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Ahmed Owner',
        'email' => 'taken@acme.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('email');
});

test('registration fails when the password confirmation does not match', function () {
    $response = $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Ahmed Owner',
        'email' => 'ahmed@acme.example',
        'password' => 'password123',
        'password_confirmation' => 'not-the-same',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('password');
});

test('two organizations get distinct slugs even with the same name', function () {
    $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Ahmed Owner',
        'email' => 'ahmed@acme.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated();

    $this->postJson('/api/auth/register', [
        'organization_name' => 'Acme Security',
        'full_name' => 'Mohamed Owner',
        'email' => 'mohamed@acme2.example',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated();

    $slugs = Company::where('name', 'Acme Security')->pluck('slug');

    expect($slugs)->toHaveCount(2)
        ->and($slugs->unique())->toHaveCount(2);
});
