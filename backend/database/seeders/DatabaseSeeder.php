<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Alert;
use App\Models\ApiKey;
use App\Models\Company;
use App\Models\Observation;
use App\Models\Prediction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Follows the documented dependency order: companies -> users/agents ->
     * api_keys -> observations -> predictions -> alerts. Model events stay
     * active (no WithoutModelEvents) so the ApiKey "single ACTIVE key"
     * business rule still runs during seeding.
     */
    public function run(): void
    {
        $company = Company::factory()->create([
            'name' => 'Test Company',
            'slug' => 'test-company',
        ]);

        User::factory()->owner()->create([
            'company_id' => $company->id,
            'full_name' => 'Test Owner',
            'email' => 'owner@test-company.example',
        ]);

        User::factory(2)->for($company)->create();

        Agent::factory(5)
            ->for($company)
            ->has(ApiKey::factory())
            ->create()
            ->each(function (Agent $agent) {
                Observation::factory(3)->for($agent)->create();
            });

        Observation::factory()
            ->for($company)
            ->for(Agent::factory()->for($company))
            ->completed()
            ->has(
                Prediction::factory()
                    ->malicious()
                    ->has(Alert::factory())
            )
            ->create();
    }
}
