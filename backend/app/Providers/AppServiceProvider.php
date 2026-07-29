<?php

namespace App\Providers;

use App\Enums\AgentStatus;
use App\Enums\ApiKeyStatus;
use App\Models\ApiKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerAgentApiKeyGuard();
    }

    /**
     * Implements the API Key verification contract exactly as specified in
     * contracts/api-key-format.md §3: extract -> hash -> look up an ACTIVE
     * key -> resolve the Agent -> resolve the Company (via the Agent
     * relationship). Returns null (authentication fails) unless every step
     * succeeds, including the Agent itself being ACTIVE (not ARCHIVED) -
     * see contracts/auth-errors.md.
     */
    private function registerAgentApiKeyGuard(): void
    {
        Auth::viaRequest('agent-api-key', function (Request $request) {
            $rawKey = $request->header('X-API-Key');

            if (! $rawKey) {
                return null;
            }

            $apiKey = ApiKey::query()
                ->where('key_hash', hash('sha256', $rawKey))
                ->where('status', ApiKeyStatus::Active)
                ->first();

            if (! $apiKey || ($apiKey->expires_at && $apiKey->expires_at->isPast())) {
                return null;
            }

            $agent = $apiKey->agent;

            if (! $agent || $agent->status !== AgentStatus::Active) {
                return null;
            }

            $apiKey->forceFill(['last_used_at' => now()])->save();
            $agent->forceFill(['last_seen_at' => now()])->save();

            return $agent;
        });
    }
}
