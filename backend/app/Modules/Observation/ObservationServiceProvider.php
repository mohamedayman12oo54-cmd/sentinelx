<?php

namespace App\Modules\Observation;

use App\Modules\Observation\Application\Contracts\ObservationLookupContract;
use App\Modules\Observation\Infrastructure\Persistence\ObservationRepository;
use Illuminate\Support\ServiceProvider;

class ObservationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ObservationLookupContract::class, ObservationRepository::class);
    }
}
