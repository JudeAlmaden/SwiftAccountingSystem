<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ControlNumberPrefix extends Model
{
    protected $fillable = ['code', 'label', 'sort_order'];

    public function getCodeUpperAttribute(): string
    {
        return strtoupper((string) $this->code);
    }
}
