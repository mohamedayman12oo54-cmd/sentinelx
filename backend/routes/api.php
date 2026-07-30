<?php

use App\Modules\Agent\API\Controllers\AgentController;
use App\Modules\Authentication\Identity\API\Controllers\AuthController;
use App\Modules\Authentication\Identity\API\Controllers\EmailVerificationController;
use Illuminate\Support\Facades\Route;

// ======= Public Auth Routes =======

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::get('/auth/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('verification.verify');

// ======= Protected Auth Routes =======

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/auth/email/resend', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:5,1');
});

// ======= Agent Routes =======

// An authenticated Agent's one Capability is Submit Observation
// (06-authorization.md §12) — the "agent" guard succeeding already implies
// it, so no separate capability middleware exists for a single capability.
Route::middleware('auth:agent')->group(function () {
    Route::get('/agent/me', [AgentController::class, 'me']);
});
