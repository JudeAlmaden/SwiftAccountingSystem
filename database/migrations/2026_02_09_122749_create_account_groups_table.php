<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('grp_code')->nullable();
            $table->enum('account_type', ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses']);
            $table->string('sub_account_type')->nullable(); // Optional, e.g. Current Assets
            $table->timestamps();
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->foreignId('account_group_id')->nullable()->constrained('account_groups')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropForeign(['account_group_id']);
            $table->dropColumn('account_group_id');
        });
        Schema::dropIfExists('account_groups');
    }
};
