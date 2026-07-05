<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

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
            JournalSeeder::class,
        ]);
    }
}
