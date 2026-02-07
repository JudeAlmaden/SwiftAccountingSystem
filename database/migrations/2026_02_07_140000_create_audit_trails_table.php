<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit trails table. Records are append-only for compliance.
 * In production, revoke UPDATE and DELETE on this table from the application's
 * DB user so even direct SQL cannot tamper with logs. See docs/AUDIT_TRAILS.md.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_trails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 64)->index();
            $table->string('description');
            $table->string('subject_type', 128)->nullable()->index();
            $table->unsignedBigInteger('subject_id')->nullable()->index();
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_trails');
    }
};
