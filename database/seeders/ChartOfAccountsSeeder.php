<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account; 

class ChartOfAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks to allow truncation
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\Account::truncate();
        \App\Models\AccountGroup::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Seed Account Groups
        $groupsFile = database_path('seeders/account_groups.csv');
        $groupLookup = [];

        if (($handle = fopen($groupsFile, "r")) !== FALSE) {
            $header = fgetcsv($handle, 1000, ","); // Skip header
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if (count($data) < 4) continue;
                
                $group = \App\Models\AccountGroup::create([
                    'name' => $data[0],
                    'grp_code' => $data[1],
                    'account_type' => $data[2],
                    'sub_account_type' => $data[3],
                ]);

                if ($data[1]) {
                    $groupLookup[$data[1]] = $group->id;
                }
            }
            fclose($handle);
        }

        // 2. Seed Accounts
        $accountsFile = database_path('seeders/accounts.csv');
        if (($handle = fopen($accountsFile, "r")) !== FALSE) {
            $header = fgetcsv($handle, 1000, ","); // Skip header
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if (count($data) < 7) continue;

                $grpCode = $data[6];
                $groupId = $groupLookup[$grpCode] ?? null;

                \App\Models\Account::create([
                    'account_name' => $data[0],
                    'account_description' => $data[1],
                    'account_code' => $data[2],
                    'account_type' => $data[3],
                    'sub_account_type' => $data[4],
                    'account_normal_side' => strtolower($data[5]),
                    'account_group_id' => $groupId,
                    'status' => 'active',
                ]);
            }
            fclose($handle);
        }
    }
}
