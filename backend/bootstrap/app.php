<?php

use App\Http\Middleware\AssignRequestId;
use App\Modules\Analysis\Infrastructure\Queue\PollPendingObservationsCommand;
use App\Modules\Authentication\Identity\API\Middleware\EnsureUserHasRole;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        // Lives inside the Analysis module's own Infrastructure/Queue layer
        // rather than app/Console/Commands — every module keeps its own
        // pieces together, per 06-implementation-layers.md §2.
        PollPendingObservationsCommand::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);

        // Global and first, so request_id is stashed on the Request (and in
        // Log::withContext()) before any route middleware, controller, or
        // exception has a chance to run. See AssignRequestId's own doc-block.
        $middleware->prepend(AssignRequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Every authentication failure on api/* returns the same generic
        // shape, regardless of cause — see contracts/auth-errors.md §1-2.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'error' => 'authentication_failed',
                    'message' => 'Authentication failed.',
                ], 401);
            }
        });

        // Runs after every other render()/renderable() callback above (and
        // the framework's own default renderer) has already produced a
        // Response — the one place that can inject request_id into EVERY
        // error shape this API returns today, nested or flat, without
        // touching each individual exception's render() method. A thrown
        // exception never reaches AssignRequestId's own "after" half (see
        // its doc-block), so the header is set here too, not left to that
        // middleware. See ERROR-003/OBS-001.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return $response;
            }

            $requestId = $request->attributes->get('request_id') ?? (string) Str::uuid();
            $response->headers->set('X-Request-Id', $requestId);

            $data = json_decode($response->getContent() ?: 'null', true);

            if (is_array($data)) {
                if (isset($data['error']) && is_array($data['error'])) {
                    $data['error']['request_id'] = $requestId;
                } else {
                    $data['request_id'] = $requestId;
                }

                $response->setContent(json_encode($data));
            }

            return $response;
        });
    })->create();
