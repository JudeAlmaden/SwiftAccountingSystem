<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_id',
        'file_path',
        'file_name',
        'file_type',
    ];

    /**
     * Get the journal that owns this attachment.
     */
    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class);
    }
}
