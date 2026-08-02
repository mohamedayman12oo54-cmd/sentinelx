<?php

namespace App\Modules\Authentication\Identity\Application;

use App\Modules\Authentication\Identity\Domain\AuthenticationFailedException;
use App\Modules\Authentication\Identity\Domain\Events\UserLoggedIn;
use App\Modules\Authentication\Identity\Domain\UserStatus;
use App\Modules\Authentication\Identity\Infrastructure\Persistence\User;
use Illuminate\Support\Facades\Hash;
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
            throw new AuthenticationFailedException('Invalid credentials.');
        }

        if ($user->status !== UserStatus::Active) {
            throw new AuthenticationFailedException('User is not active.');
        }

        if (! $user->hasVerifiedEmail()) {
            throw new AuthenticationFailedException('Email is not verified.');
        }

        $token = JWTAuth::fromUser($user);

        $user->forceFill(['last_login_at' => now()])->save();

        UserLoggedIn::dispatch($user->id, $user->organization_id);

        return $token;
    }
}
