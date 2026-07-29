<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => static::$password ??= Hash::make('password'),
            'role' => UserRole::Member,
            'status' => UserStatus::Active,
            'last_login_at' => null,
            'email_verified_at' => now(),
        ];
    }

    /**
     * Indicate that the user owns the company account.
     */
    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Owner,
        ]);
    }

    /**
     * Indicate that the user is disabled.
     */
    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UserStatus::Disabled,
        ]);
    }

    /**
     * Indicate that the user has not yet verified their email address.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
