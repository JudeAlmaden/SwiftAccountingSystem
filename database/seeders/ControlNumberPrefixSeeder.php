<?php

namespace Database\Seeders;

use App\Models\ControlNumberPrefix;
use Illuminate\Database\Seeder;

class ControlNumberPrefixSeeder extends Seeder
{
    public function run(): void
    {
        $prefixes = [
            ['code' => 'DV', 'label' => 'Disbursement Voucher (Default)'],
            ['code' => 'JV', 'label' => 'Journal Voucher'],
            ['code' => 'MIE', 'label' => 'Manual Income Entry'],
        ];

        foreach ($prefixes as $index => $prefix) {
            ControlNumberPrefix::updateOrCreate(
                ['code' => $prefix['code']],
                [
                    'label' => $prefix['label'],
                    'sort_order' => $index,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

}
