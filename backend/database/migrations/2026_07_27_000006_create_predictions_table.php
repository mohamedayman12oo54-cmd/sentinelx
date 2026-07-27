<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('observation_id')->unique()->constrained('observations')->restrictOnDelete();
            $table->string('verdict', 20);
            $table->decimal('confidence', 3, 2);
            $table->unsignedTinyInteger('risk_score');
            $table->text('summary');
            $table->string('model_version');
            $table->jsonb('prediction_json');
            $table->timestamp('analyzed_at');
            $table->timestamps();
        });

        // CHECK constraints are only portable on the production database
        // engine (PostgreSQL). SQLite — used for the test suite — cannot
        // add table-level CHECK constraints after creation, so this guard
        // keeps the schema valid there while still enforcing the documented
        // ranges (0-100 / 0-1) in the real database. See constraints.md.
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE predictions ADD CONSTRAINT predictions_risk_score_check CHECK (risk_score BETWEEN 0 AND 100)');
            DB::statement('ALTER TABLE predictions ADD CONSTRAINT predictions_confidence_check CHECK (confidence BETWEEN 0 AND 1)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
