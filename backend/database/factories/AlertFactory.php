<?php

namespace Database\Factories;

use App\Enums\AlertStatus;
use App\Enums\Severity;
use App\Models\Alert;
use App\Models\Prediction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Alert>
 */
class AlertFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'prediction_id' => Prediction::factory()->malicious(),
            'severity' => fake()->randomElement(Severity::cases()),
            'status' => AlertStatus::Open,
            'acknowledged_at' => null,
            'resolved_at' => null,
        ];
    }

    /**
     * Indicate the alert has been acknowledged.
     */
    public function acknowledged(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AlertStatus::Acknowledged,
            'acknowledged_at' => now(),
        ]);
    }

    /**
     * Indicate the alert has been resolved.
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AlertStatus::Resolved,
            'acknowledged_at' => now()->subHour(),
            'resolved_at' => now(),
        ]);
    }
}
