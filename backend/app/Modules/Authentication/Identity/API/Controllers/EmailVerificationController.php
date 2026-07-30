<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * GET /api/auth/verify-email/{id}/{hash}
     *
     * The `signed` route middleware already validated the URL's signature
     * and expiry before this action runs — see 03-authentication-flow.md's
     * "signed, expiring URL" mechanism. This action only checks that the
     * hash matches the target user's current email, then persists the
     * result to email_verified_at (ADR-006).
     */
    public function verify(Request $request, string $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return response()->json(['message' => 'Email verified successfully.']);
    }

    // POST /api/auth/email/resend
    public function resend(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }
}
