<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalTracking extends Model
{
    use HasFactory;

    protected $table = 'journal_tracking';

    protected $fillable = [
        'journal_id',
        'handled_by',
        'step',
        'role',
        'action',
        'remarks',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    /**
     * Get the journal that owns this tracking record.
     */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }

    /**
     * Get the user who handled this journal.
     */
    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
