<?php

namespace Database\Seeders;

use App\Models\ControlNumberPrefix;
use Illuminate\Database\Seeder;

class ControlNumberPrefixSeeder extends Seeder
{
    public function run(): void
    {
        if (ControlNumberPrefix::exists()) {
            return;
        }

        ControlNumberPrefix::insert([
            ['code' => 'DV', 'label' => 'Disbursement Voucher (Default)', 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'JV', 'label' => 'Journal Voucher', 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
