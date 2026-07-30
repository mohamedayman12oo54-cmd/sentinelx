<?php

namespace App\Modules\Authentication;

use App\Modules\Authentication\ApiKey\Application\ValidateApiKeyAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the Authentication module's guards.
     */
    public function boot(): void
    {
        $this->registerAgentApiKeyGuard();
    }

    /**
     * Registers the "agent-api-key" guard used by config/auth.php. The
     * actual verification rule lives in the API Key submodule's
     * ValidateApiKeyAction — this provider only wires it into Laravel's
     * Auth::viaRequest() mechanism.
     */
    private function registerAgentApiKeyGuard(): void
    {
        Auth::viaRequest('agent-api-key', function (Request $request) {
            return app(ValidateApiKeyAction::class)->handle($request->header('X-API-Key'));
        });
    }
}
