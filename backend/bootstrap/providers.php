<?php

use App\Modules\Agent\AgentServiceProvider;
use App\Modules\Authentication\AuthServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AgentServiceProvider::class,
    AuthServiceProvider::class,
];
