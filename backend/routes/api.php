<?php

use App\Modules\Agent\API\Controllers\AgentController;
use App\Modules\Agent\API\Middleware\EnsureOwnerRole;
use App\Modules\Alert\API\Controllers\AlertController;
use App\Modules\Authentication\ApiKey\API\Controllers\ApiKeyController;
use App\Modules\Authentication\Identity\API\Controllers\AuthController;
use App\Modules\Authentication\Identity\API\Controllers\EmailVerificationController;
use App\Modules\Dashboard\API\Controllers\DashboardController;
use App\Modules\Observation\API\Controllers\AgentObservationController;
use App\Modules\Observation\API\Controllers\ObservationController;
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

    // Owned by the Observation module. API Key guard only — a Human,
    // regardless of Role, can never submit an Observation; there is no
    // Role check to write here at all, the JWT guard simply never matches
    // this route. See 06-authorization.md §2.
    Route::post('/v1/observations', [ObservationController::class, 'store']);
});

// ======= Agent Management Routes (Stage 2) =======

// Every route below requires the Human/JWT guard — an authenticated Agent
// can never reach these, per 05-authorization.md §3 (enforced at routing,
// not inside a permission check). Owner-only routes additionally require
// EnsureOwnerRole; Owner+Member routes only require authentication.
Route::prefix('v1')->middleware('auth:api')->group(function () {
    Route::get('/agents', [AgentController::class, 'index']);
    Route::get('/agents/{agentId}', [AgentController::class, 'show']);

    // Owned by the Observation module (confirmed in
    // docs/backend/agent/06-api-contract.md §7 as Observation-owned,
    // despite sharing the /agents URL prefix — route grouping ≠ module
    // ownership, same nuance as Stage 2's rotate-api-key).
    Route::get('/agents/{agentId}/observations', [AgentObservationController::class, 'index']);

    Route::middleware(EnsureOwnerRole::class)->group(function () {
        Route::post('/agents', [AgentController::class, 'store']);
        Route::patch('/agents/{agentId}', [AgentController::class, 'update']);
        Route::patch('/agents/{agentId}/archive', [AgentController::class, 'archive']);

        // Owned by the Authentication module's API Key submodule — see
        // 01-overview.md §5. Reuses EnsureOwnerRole because Authentication
        // is allowed to depend on Agent (05-module-dependencies.md §4).
        Route::post('/agents/{agentId}/rotate-api-key', [ApiKeyController::class, 'rotate']);
    });

    // ======= Observation Routes (Stage 3) =======

    // Owner, Admin, and Member all have identical read access — no mutation
    // is possible at all (Observations are immutable), so there is no Role
    // tier to restrict. See 06-authorization.md §2.
    Route::get('/observations', [ObservationController::class, 'index']);
    Route::get('/observations/{observationId}', [ObservationController::class, 'show']);

    // ======= Alert Routes (Stage 5) =======

    // Owner, Admin, and Member all have identical access to every action
    // here — a deliberate, reasoned gap-fill, not an oversight. See
    // 04-authorization.md and adr/ADR-003-all-roles-can-act-on-alerts.md.
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::get('/alerts/{alertId}', [AlertController::class, 'show']);
    Route::patch('/alerts/{alertId}/acknowledge', [AlertController::class, 'acknowledge']);
    Route::patch('/alerts/{alertId}/resolve', [AlertController::class, 'resolve']);

    // ======= Dashboard Routes (Stage 6) =======

    // Owner, Admin, and Member all have identical, full access — every
    // value in the response is already independently visible to all three
    // Roles through its own underlying endpoint. See 05-authorization.md
    // and adr/ADR-003-all-roles-can-view-dashboard.md.
    Route::get('/dashboard', [DashboardController::class, 'show']);
});
