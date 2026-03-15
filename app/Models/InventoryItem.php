<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'description',
        'unit',
        'quantity_on_hand',
        'low_stock_threshold',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'integer',
            'low_stock_threshold' => 'integer',
        ];
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}
