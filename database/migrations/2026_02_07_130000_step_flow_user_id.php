<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Convert step_flow from user_name to user_id so names can change without losing the actor.
     */
    public function up(): void
    {
        $rows = DB::table('disbursements')->get(['id', 'step_flow']);
        foreach ($rows as $row) {
            $flow = json_decode($row->step_flow, true);
            if (!is_array($flow)) {
                continue;
            }
            $updated = false;
            foreach ($flow as &$step) {
                $step = (array) $step;
                if (array_key_exists('user_name', $step)) {
                    $name = $step['user_name'];
                    unset($step['user_name']);
                    $step['user_id'] = $name ? (DB::table('users')->where('name', $name)->value('id') ?? null) : null;
                    $updated = true;
                }
                if (!array_key_exists('user_id', $step)) {
                    $step['user_id'] = null;
                    $updated = true;
                }
            }
            if ($updated) {
                DB::table('disbursements')->where('id', $row->id)->update([
                    'step_flow' => json_encode($flow),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $rows = DB::table('disbursements')->get(['id', 'step_flow']);
        foreach ($rows as $row) {
            $flow = json_decode($row->step_flow, true);
            if (!is_array($flow)) {
                continue;
            }
            $updated = false;
            foreach ($flow as &$step) {
                if (isset($step['user_id'])) {
                    $id = $step['user_id'];
                    unset($step['user_id']);
                    $step['user_name'] = $id ? (DB::table('users')->where('id', $id)->value('name') ?? null) : null;
                    $updated = true;
                }
            }
            if ($updated) {
                DB::table('disbursements')->where('id', $row->id)->update([
                    'step_flow' => json_encode($flow),
                ]);
            }
        }
    }
};
