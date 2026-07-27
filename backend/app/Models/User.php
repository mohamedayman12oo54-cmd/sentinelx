<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'full_name',
        'email',
        'password_hash',
        'role',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $attributes = [
        'status' => UserStatus::Active->value,
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Users authenticate with password_hash — this platform has no
     * `password` column (see naming-conventions.md).
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    // ======= Relationships =======

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
