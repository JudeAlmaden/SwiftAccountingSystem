<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit trail records are append-only and must never be updated or deleted
 * (including by admins) for compliance. The model blocks update/delete in code;
 * for full protection, the DB user should have only SELECT and INSERT on this table.
 */
class AuditTrail extends Model
{
    protected static function booted(): void
    {
        static::updating(fn () => self::throwImmutable());
        static::deleting(fn () => self::throwImmutable());
    }

    private static function throwImmutable(): never
    {
        throw new \RuntimeException('Audit trail records cannot be modified or deleted.');
    }

    protected $fillable = [
        'user_id',
        'event_type',
        'description',
        'subject_type',
        'subject_id',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        string $eventType,
        string $description,
        ?int $userId = null,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?array $properties = null
    ): self {
        return self::create([
            'user_id'      => $userId ?? auth()->id(),
            'event_type'   => $eventType,
            'description'  => $description,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
            'properties'   => $properties,
            'ip_address'   => request()?->ip(),
            'user_agent'   => request()?->userAgent(),
        ]);
    }
}
