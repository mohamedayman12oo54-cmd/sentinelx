<?php

namespace App\Modules\Authentication\Identity\Application;

use App\Modules\Authentication\Identity\Domain\UserRole;
use App\Modules\Authentication\Identity\Domain\UserStatus;
use App\Modules\Authentication\Identity\Infrastructure\Persistence\User;
use App\Modules\Organization\Domain\OrganizationStatus;
use App\Modules\Organization\Infrastructure\Persistence\Organization;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterUserAction
{
    /**
     * Register creates a new Organization and its first User, who
     * is always the Owner — never a bare User. See
     * 08-identity-lifecycle.md §2-3.
     *
     * @param  array{organization_name: string, full_name: string, email: string, password: string}  $data
     */
    public function handle(array $data): User
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
}
