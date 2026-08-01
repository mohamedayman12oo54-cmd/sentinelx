<?php

use App\Modules\Alert\Application\Contracts\AlertSummaryContract;
use App\Modules\Alert\Domain\AlertStatus;
use App\Modules\Organization\Infrastructure\Persistence\Organization;

// === HAPPY PATH ===

test('countByStatusForOrganization returns accurate counts scoped to the organization', function () {
    $organizationA = Organization::factory()->create();
    $organizationB = Organization::factory()->create();

    alertWithStatusFor($organizationA, AlertStatus::Open);
    alertWithStatusFor($organizationA, AlertStatus::Open);
    alertWithStatusFor($organizationA, AlertStatus::Resolved);
    alertWithStatusFor($organizationB, AlertStatus::Open);

    $counts = app(AlertSummaryContract::class)->countByStatusForOrganization($organizationA->id);

    expect($counts)->toBe(['OPEN' => 2, 'ACKNOWLEDGED' => 0, 'RESOLVED' => 1]);
});

// === EDGE CASE ===

test('countByStatusForOrganization returns all zeros for an organization with no alerts', function () {
    $organization = Organization::factory()->create();

    $counts = app(AlertSummaryContract::class)->countByStatusForOrganization($organization->id);

    expect($counts)->toBe(['OPEN' => 0, 'ACKNOWLEDGED' => 0, 'RESOLVED' => 0]);
});
