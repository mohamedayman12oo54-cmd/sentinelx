<?php

namespace App\Services;

use App\Enums\OrganizationStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\AuthenticationFailedException;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    // ======= Register =======

    /**
     * Register creates a new Organization and its first User, who
     * is always the Owner — never a bare User. See
     * 08-identity-lifecycle.md §2-3.
     *
     * @param  array{organization_name: string, full_name: string, email: string, password: string}  $data
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $organization = Organization::create([
                'name' => $data['organization_name'],
                'slug' => $this->uniqueSlug($data['organization_name']),
                'status' => OrganizationStatus::Active,
            ]);

            /** @var User $user */
            $user = $organization->users()->create([
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'role' => UserRole::Owner,
                'status' => UserStatus::Active,
            ]);

            $user->sendEmailVerificationNotification();

            return $user;
        });
    }

    private function uniqueSlug(string $organizationName): string
    {
        $base = Str::slug($organizationName);
        $slug = $base;
        $suffix = 1;

        while (Organization::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    // ======= Login =======

    /**
     * @param  array{email: string, password: string}  $credentials
     *
     * @throws AuthenticationFailedException
     */
    public function login(array $credentials): string
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

        return $token;
    }

    // ======= Logout =======

    /**
     * Logout is client-side only in V1 — no server-side token blacklist
     * exists yet, matching 04-jwt.md §9. This method exists so the
     * controller has a single, testable point of extension if that changes.
     */
    public function logout(): void
    {
        // Intentionally a no-op — see 04-jwt.md §9.
    }

    // ======= Refresh =======

    public function refresh(): string
    {
        return JWTAuth::parseToken()->refresh();
    }

    // ======= Me =======

    public function me(): User
    {
        /** @var User $user */
        $user = auth('api')->user();

        return $user;
    }
}
