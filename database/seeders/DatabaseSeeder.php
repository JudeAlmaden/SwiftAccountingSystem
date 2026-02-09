<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Database\Seeders\ChartOfAccountsSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {        
        // Clean up attachments directory
        $files = \Illuminate\Support\Facades\Storage::disk('public')->allFiles('attachments');
        \Illuminate\Support\Facades\Storage::disk('public')->delete($files);

        $this->call([
            RolesSeeder::class,
            UsersSeeder::class,
            ChartOfAccountsSeeder::class,
            ControlNumberPrefixSeeder::class,
            DisbursementSeeder::class,
        ]);
    }
}
