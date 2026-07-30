<?php

use App\Enums\CompanyStatus;
use App\Models\Company;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\QueryException;

// === HAPPY PATH ===

test('a company can be created with a unique slug and defaults to ACTIVE', function () {
    $company = Company::factory()->create(['slug' => 'acme-corp']);

    expect($company->id)->toBeString()
        ->and($company->slug)->toBe('acme-corp')
        ->and($company->status)->toBe(CompanyStatus::Active);

    $this->assertDatabaseHas('companies', [
        'id' => $company->id,
        'slug' => 'acme-corp',
        'status' => 'ACTIVE',
    ]);
});

test('status is cast to the CompanyStatus enum', function () {
    $company = Company::factory()->suspended()->create();

    expect($company->status)->toBe(CompanyStatus::Suspended);
});

// === CONSTRAINTS ===

test('two companies may share the same name', function () {
    Company::factory()->create(['name' => 'Duplicate Inc']);
    $second = Company::factory()->create(['name' => 'Duplicate Inc']);

    expect($second->exists)->toBeTrue();
});

test('slug must be unique', function () {
    Company::factory()->create(['slug' => 'unique-slug']);

    expect(fn () => Company::factory()->create(['slug' => 'unique-slug']))
        ->toThrow(QueryException::class);
});

// === RELATIONSHIPS ===

test('a company has many users, agents, and observations', function () {
    $company = Company::factory()->create();

    expect($company->users())->toBeInstanceOf(HasMany::class)
        ->and($company->agents())->toBeInstanceOf(HasMany::class)
        ->and($company->observations())->toBeInstanceOf(HasMany::class);
});
