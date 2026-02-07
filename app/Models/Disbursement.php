<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Disbursement extends Model
{

    use HasFactory;

    protected $fillable = [
        'control_number',
        'title',
        'description',
        'step_flow',
        'current_step',
        'status',
        'recommended_by',
    ];

    protected $casts = [
        'step_flow' => 'array',
        'current_step' => 'integer',
    ];

    /**
     * Default approval flow: step 1 = preparer (role null), 2 = accounting head, 3 = auditor, 4 = svp.
     * user_id: optional. When null, any user with that role can approve/decline. When set, only that
     * user (or admin) can act at this step — for when a step is restricted to a specific person.
     * Who actually acted is stored in disbursement_tracking (handled_by), not in step_flow.
     */
    public static function defaultStepFlow(): array
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
     * Get the disbursement items for this disbursement.
     */
    public function items(): HasMany
    {
        return $this->hasMany(DisbursementItem::class);
    }

    /**
     * Get the tracking records for this disbursement.
     */
    public function tracking(): HasMany
    {
        return $this->hasMany(DisbursementTracking::class);
    }

    /**
     * Get the attachments for this disbursement.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(DisbursementAttachment::class);
    }
}
