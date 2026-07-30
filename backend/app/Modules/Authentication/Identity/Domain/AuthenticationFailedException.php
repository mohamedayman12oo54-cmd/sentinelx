<?php

namespace App\Modules\Authentication\Identity\Domain;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Thrown for every authentication failure, regardless of underlying cause
 * (wrong password, unknown email, disabled user, unverified email, revoked
 * API key, archived agent, expired/invalid JWT...). The client always
 * receives the same generic response — see contracts/auth-errors.md §1-2.
 * The specific reason is for logs only, never the response body.
 */
class AuthenticationFailedException extends RuntimeException
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'error' => 'authentication_failed',
            'message' => 'Authentication failed.',
        ], 401);
    }
}
