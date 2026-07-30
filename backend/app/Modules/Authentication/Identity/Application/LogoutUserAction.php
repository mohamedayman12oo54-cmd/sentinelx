<?php

namespace App\Modules\Authentication\Identity\Application;

class LogoutUserAction
{
    /**
     * Logout is client-side only in V1 — no server-side token blacklist
     * exists yet, matching 04-jwt.md §9. This Action exists so the
     * controller has a single, testable point of extension if that changes.
     */
    public function handle(): void
    {
        // Intentionally a no-op — see 04-jwt.md §9.
    }
}
