<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Replaces integer `step` with:
     * - step_flow: JSON array of { user_name, role } per step (1..4)
     * - current_step: which step is next (1-4)
     */
    public function up(): void
    {
        $defaultFlow = json_encode([
            ['user_name' => null, 'role' => null],
            ['user_name' => null, 'role' => 'accounting head'],
            ['user_name' => null, 'role' => 'auditor'],
            ['user_name' => null, 'role' => 'svp'],
        ]);

        Schema::table('disbursements', function (Blueprint $table) {
            $table->json('step_flow')->nullable()->after('description');
            $table->unsignedTinyInteger('current_step')->default(1)->after('step_flow');
        });

        // Backfill: copy step to current_step and set step_flow
        $rows = DB::table('disbursements')->get(['id', 'step']);
        foreach ($rows as $row) {
            DB::table('disbursements')->where('id', $row->id)->update([
                'step_flow' => $defaultFlow,
                'current_step' => (int) $row->step,
            ]);
        }

        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropColumn('step');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->integer('step')->default(1)->after('description');
        });

        $rows = DB::table('disbursements')->get(['id', 'current_step']);
        foreach ($rows as $row) {
            DB::table('disbursements')->where('id', $row->id)->update([
                'step' => (int) $row->current_step,
            ]);
        }

        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropColumn(['step_flow', 'current_step']);
        });
    }
};
