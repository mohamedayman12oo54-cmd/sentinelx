<?php

use App\Modules\Agent\API\Controllers\AgentController;
use App\Modules\Agent\API\Middleware\EnsureOwnerRole;
use App\Modules\Authentication\ApiKey\API\Controllers\ApiKeyController;
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

// ======= Agent Self Routes =======

// An authenticated Agent's one Capability is Submit Observation
// (06-authorization.md §12) — the "agent" guard succeeding already implies
// it, so no separate capability middleware exists for a single capability.
Route::middleware('auth:agent')->group(function () {
    Route::get('/agent/me', [AgentController::class, 'me']);
});

// ======= Agent Management Routes (Stage 2) =======

// Every route below requires the Human/JWT guard — an authenticated Agent
// can never reach these, per 05-authorization.md §3 (enforced at routing,
// not inside a permission check). Owner-only routes additionally require
// EnsureOwnerRole; Owner+Member routes only require authentication.
Route::prefix('v1')->middleware('auth:api')->group(function () {
    Route::get('/agents', [AgentController::class, 'index']);
    Route::get('/agents/{agentId}', [AgentController::class, 'show']);

    Route::middleware(EnsureOwnerRole::class)->group(function () {
        Route::post('/agents', [AgentController::class, 'store']);
        Route::patch('/agents/{agentId}', [AgentController::class, 'update']);
        Route::patch('/agents/{agentId}/archive', [AgentController::class, 'archive']);

        // Owned by the Authentication module's API Key submodule — see
        // 01-overview.md §5. Reuses EnsureOwnerRole because Authentication
        // is allowed to depend on Agent (05-module-dependencies.md §4).
        Route::post('/agents/{agentId}/rotate-api-key', [ApiKeyController::class, 'rotate']);
    });
});
