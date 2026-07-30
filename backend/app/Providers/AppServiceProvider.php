<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Models live under App\Modules\{Module}\Infrastructure\Persistence
        // rather than App\Models, so Eloquent's default factory-name guesser
        // (which only strips the App\Models\ or App\ prefix) can't find
        // Database\Factories\{Model}Factory on its own — resolve by class
        // basename instead, matching every existing factory's name.
        Factory::guessFactoryNamesUsing(
            fn (string $modelName): string => 'Database\\Factories\\'.Str::afterLast($modelName, '\\').'Factory'
        );
    }
}
