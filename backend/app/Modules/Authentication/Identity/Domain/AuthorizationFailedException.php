<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Thrown when an authenticated identity is denied by Authorization (role or
 * capability check) — distinct from AuthenticationFailedException, since the
 * identity itself was already verified. See contracts/auth-errors.md §3.
 */
class AuthorizationFailedException extends RuntimeException
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'error' => 'forbidden',
            'message' => 'You do not have permission to perform this action.',
        ], 403);
    }
}
