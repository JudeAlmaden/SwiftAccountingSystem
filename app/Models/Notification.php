<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'title',
        'user_id',
        'message',
        'is_read',
        'link',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::created(function ($notification) {
            broadcast(new \App\Events\NotificationCreated($notification));
        });
    }
}
