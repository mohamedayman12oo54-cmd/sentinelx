<?php

namespace App\Modules\Authentication\ApiKey\Application;

use App\Modules\Agent\Application\Contracts\AgentLookupContract;
use App\Modules\Agent\Domain\AgentStatus;
use App\Modules\Agent\Domain\Exceptions\AgentNotActiveException;
use App\Modules\Agent\Domain\Exceptions\AgentNotFoundException;
use App\Modules\Authentication\ApiKey\Infrastructure\Persistence\ApiKey;

/**
 * The API Key submodule is allowed to depend on Agent (see
 * 05-module-dependencies.md §4) — this Action is the concrete expression
 * of that allowed direction. It never queries `agents` directly; it only
 * asks the Agent module's own read-only contract.
 */
class RotateApiKeyAction
{
    public function __construct(
        private readonly AgentLookupContract $agents,
        private readonly GenerateApiKeyAction $generateApiKey,
    ) {}

    /**
     * @return array{api_key: ApiKey, raw_key: string}
     *
     * @throws AgentNotFoundException
     * @throws AgentNotActiveException
     */
    public function handle(string $organizationId, string $agentId): array
    {
        $agent = $this->agents->findActiveAgentForOrganization($agentId, $organizationId);

        if (! $agent) {
            throw new AgentNotFoundException;
        }

        if ($agent->status !== AgentStatus::Active) {
            throw new AgentNotActiveException;
        }

        return $this->generateApiKey->handle($agent->id);
    }
}
