<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = [
        'record_date',
        'acquisition_date',
        'amount',
        'supplier_name',
        'location',
        'serial_prefix',
        'serial_number',
        'bulk',
        'created_by',
        'verified_by',
        'verification_status',
        'verified_at',
        'audit_remarks',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'record_date' => 'date',
            'acquisition_date' => 'date',
            'amount' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
