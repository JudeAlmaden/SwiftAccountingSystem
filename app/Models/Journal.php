<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{

    use HasFactory;

    protected $fillable = [
        'control_number',
        'type',
        'title',
        'description',
        'step_flow',
        'current_step',
        'status',
        'check_id',
    ];

    protected $casts = [
        'step_flow' => 'array',
        'current_step' => 'integer',
    ];

    /**
     * Default approval flow: 
     * Step 1 = accounting assistant generates voucher
     * Step 2 = accounting head approval
     * Step 3 = auditor approval
     * Step 4 = svp approval
     * Step 5 = back to accounting assistant for final approval
     * 
     * user_id: optional. When null, any user with that role can approve/decline. When set, only that
     * user (or admin) can act at this step — for when a step is restricted to a specific person.
     * Who actually acted is stored in journal_tracking (handled_by), not in step_flow.
     */
    public static function defaultStepFlow(): array
    {
        return [
            ['user_id' => null, 'role' => null],
            ['user_id' => null, 'role' => 'accounting head'],
            ['user_id' => null, 'role' => 'auditor'],
            ['user_id' => null, 'role' => 'svp'],
            ['user_id' => null, 'role' => 'accounting assistant'], // Final approval
        ];
    }

    /**
     * Journal Voucher step flow — same as default but without the final
     * accounting assistant step (no check/cash disbursement involved).
     * Step 1 = auto-approved on creation (accounting assistant)
     * Step 2 = accounting head
     * Step 3 = auditor
     * Step 4 = svp (final)
     */
    public static function journalStepFlow(): array
    {
        return [
            ['user_id' => null, 'role' => null],
            ['user_id' => null, 'role' => 'accounting head'],
            ['user_id' => null, 'role' => 'auditor'],
            ['user_id' => null, 'role' => 'svp'],
        ];
    }

    /**
     * Step flow with user_name added for API display when user_id is set (the designated user for that step).
     */
    public function getStepFlowForApiAttribute(): array
    {
        $flow = $this->step_flow ?? self::defaultStepFlow();
        $userIds = array_filter(array_column($flow, 'user_id'));
        $users = [];
        if (!empty($userIds)) {
            $users = User::whereIn('id', $userIds)->get()->keyBy('id');
        }
        $result = [];
        foreach ($flow as $step) {
            $step = (array) $step;
            $id = $step['user_id'] ?? null;
            $step['user_name'] = $id && isset($users[$id]) ? $users[$id]->name : null;
            $result[] = $step;
        }
        return $result;
    }

    /**
     * Get the journal items for this journal.
     */
    public function items(): HasMany
    {
        return $this->hasMany(JournalItem::class);
    }

    /**
     * Get the tracking records for this journal.
     */
    public function tracking(): HasMany
    {
        return $this->hasMany(JournalTracking::class);
    }

    /**
     * Get the attachments for this journal.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(JournalAttachment::class);
    }
}
