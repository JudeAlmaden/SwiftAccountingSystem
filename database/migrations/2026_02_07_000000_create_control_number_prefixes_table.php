<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('control_number_prefixes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // e.g. DV, HED, JHS
            $table->string('label')->nullable();  // e.g. Higher Ed Department
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('control_number_prefixes');
    }
};
