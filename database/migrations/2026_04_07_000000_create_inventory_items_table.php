<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->date('record_date');
            $table->date('acquisition_date');
            $table->decimal('amount', 15, 2);
            $table->string('supplier_name');
            $table->string('location');
            $table->string('serial_prefix');
            $table->string('serial_number');
            $table->string('bulk')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('verified_by')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->string('verification_status', 32)->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->text('audit_remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
