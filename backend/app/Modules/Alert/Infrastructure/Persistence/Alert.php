<?php

namespace App\Models;

use App\Enums\AlertStatus;
use App\Enums\Severity;
use Database\Factories\AlertFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    /** @use HasFactory<AlertFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'prediction_id',
        'severity',
        'status',
        'acknowledged_at',
        'resolved_at',
    ];

    protected $attributes = [
        'status' => AlertStatus::Open->value,
    ];

    protected function casts(): array
    {
        return [
            'severity' => Severity::class,
            'status' => AlertStatus::class,
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    // ======= Relationships =======

    public function prediction(): BelongsTo
    {
        return $this->belongsTo(Prediction::class);
    }
}
