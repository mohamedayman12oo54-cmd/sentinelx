<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    // POST /api/auth/register
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());

        return (new UserResource($user))
            ->additional(['message' => 'Organization created. Please check your email to verify your account.'])
            ->response()
            ->setStatusCode(201);
    }

    // POST /api/auth/login
    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->authService->login($request->validated());

        return $this->tokenResponse($token);
    }

    // POST /api/auth/logout
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json(['message' => 'Logged out.']);
    }

    // POST /api/auth/refresh
    public function refresh(): JsonResponse
    {
        $token = $this->authService->refresh();

        return $this->tokenResponse($token);
    }

    // GET /api/auth/me
    public function me(): UserResource
    {
        return new UserResource($this->authService->me());
    }

    private function tokenResponse(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }
}
