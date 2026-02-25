<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create all journal-related tables in one place.
     * Replaces: 2026_01_25_131415_disbursement.php
     *           2026_02_07_120000_disbursement_step_flow.php
     *           2026_02_07_130000_step_flow_user_id.php
     */
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->string('control_number');
            $table->string('type')->default('disbursement'); // e.g. disbursement, payroll, adjustment
            $table->string('title');
            $table->string('description')->nullable();
            // step_flow: JSON array of { user_id: int|null, role: string|null } per step
            $table->json('step_flow')->nullable();
            $table->unsignedTinyInteger('current_step')->default(1);
            $table->string('check_id')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });

        Schema::create('journal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 10, 2);
            $table->integer('order_number');
            $table->timestamps();
        });

        //Tracks the actions done by these users
        Schema::create('journal_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->foreignId('handled_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->integer('step');
            $table->enum('role', ['accounting assistant', 'accounting head', 'auditor', 'svp']);
            $table->enum('action', ['approved', 'rejected'])->nullable()->default(null);
            $table->text('remarks')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('journal_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained('journals')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_attachments');
        Schema::dropIfExists('journal_tracking');
        Schema::dropIfExists('journal_items');
        Schema::dropIfExists('journals');
    }
};
