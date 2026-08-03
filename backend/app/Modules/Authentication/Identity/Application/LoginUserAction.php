<?php

namespace App\Modules\Authentication\Identity\Application;

use App\Modules\Authentication\Identity\Domain\AuthenticationFailedException;
use App\Modules\Authentication\Identity\Domain\Events\UserLoggedIn;
use App\Modules\Authentication\Identity\Domain\UserStatus;
use App\Modules\Authentication\Identity\Infrastructure\Persistence\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class LoginUserAction
{
    /**
     * @param  array{email: string, password: string}  $credentials
     *
     * @throws AuthenticationFailedException
     */
    public function handle(array $credentials): string
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password_hash)) {
            // The email attempted, never the password — see
            // AuthenticationFailedException's own doc-block: the specific
            // reason is for logs only, never the response body.
            Log::warning('Login failed: invalid credentials.', ['email' => $credentials['email']]);

            throw new AuthenticationFailedException('Invalid credentials.');
        }

        if ($user->status !== UserStatus::Active) {
            Log::warning('Login failed: user is not active.', ['user_id' => $user->id]);

            throw new AuthenticationFailedException('User is not active.');
        }

        if (! $user->hasVerifiedEmail()) {
            Log::warning('Login failed: email is not verified.', ['user_id' => $user->id]);

            throw new AuthenticationFailedException('Email is not verified.');
        }

        $token = JWTAuth::fromUser($user);

        $user->forceFill(['last_login_at' => now()])->save();

        Log::info('Login succeeded.', ['user_id' => $user->id, 'organization_id' => $user->organization_id]);

        UserLoggedIn::dispatch($user->id, $user->organization_id);

        return $token;
    }
}
