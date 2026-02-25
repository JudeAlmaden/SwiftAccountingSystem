<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_id',
        'account_id',
        'type',
        'amount',
        'order_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Get the journal that owns this item.
     */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    /**
     * Get the account associated with this item.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
