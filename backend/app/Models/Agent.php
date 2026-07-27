<?php

namespace App\Models;

use App\Enums\AgentStatus;
use Database\Factories\AgentFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    /** @use HasFactory<AgentFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'name',
        'framework',
        'framework_version',
        'description',
        'status',
        'last_seen_at',
    ];

    protected $attributes = [
        'status' => AgentStatus::Active->value,
    ];

    protected function casts(): array
    {
        return [
            'status' => AgentStatus::class,
            'last_seen_at' => 'datetime',
        ];
    }

    // ======= Relationships =======

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class);
    }

    public function observations(): HasMany
    {
        return $this->hasMany(Observation::class);
    }
}
