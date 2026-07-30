<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Alert;
use App\Models\ApiKey;
use App\Models\Observation;
use App\Models\Organization;
use App\Models\Prediction;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Follows the documented dependency order: organizations -> users/agents ->
     * api_keys -> observations -> predictions -> alerts. Model events stay
     * active (no WithoutModelEvents) so the ApiKey "single ACTIVE key"
     * business rule still runs during seeding.
     */
    public function run(): void
    {
        $organization = Organization::factory()->create([
            'name' => 'Test Company',
            'slug' => 'test-company',
        ]);

        User::factory()->owner()->create([
            'organization_id' => $organization->id,
            'full_name' => 'Test Owner',
            'email' => 'owner@test-company.example',
        ]);

        User::factory(2)->for($organization)->create();

        Agent::factory(5)
            ->for($organization)
            ->has(ApiKey::factory())
            ->create()
            ->each(function (Agent $agent) {
                Observation::factory(3)->for($agent)->create();
            });

        Observation::factory()
            ->for($organization)
            ->for(Agent::factory()->for($organization))
            ->completed()
            ->has(
                Prediction::factory()
                    ->malicious()
                    ->has(Alert::factory())
            )
            ->create();
    }
}
