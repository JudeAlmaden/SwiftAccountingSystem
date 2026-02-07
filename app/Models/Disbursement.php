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
        'step',
        'status',
        'recommended_by',
    ];

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
