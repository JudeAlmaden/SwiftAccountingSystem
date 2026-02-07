<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //We make a admin role, this is how we will make accounts in the future <3
        User::factory()->create([
            'name' => 'admin',
            'account_number' => '000-0001',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ])->assignRole('admin');

        //Most of these are just for testing
        User::factory()->create([
            'name' => 'accounting head',
            'account_number' => '000-0003',
            'email' => 'head@example.com',
            'password' => Hash::make('password'),
        ])->assignRole('accounting head');   

        User::factory()->create([
            'name' => 'accounting assistant',
            'account_number' => '000-0002',
            'email' => 'assistant@example.com',
            'password' => Hash::make('password'),
        ])->assignRole('accounting assistant');  

        User::factory()->create([
            'name' => 'auditor',
            'account_number' => '000-0004',
            'email' => 'auditor@example.com',
            'password' => Hash::make('password'),
        ])->assignRole('auditor');

        User::factory()->create([
            'name' => 'svp',
            'account_number' => '000-0005',
            'email' => 'svp@example.com',
            'password' => Hash::make('password'),
        ])->assignRole('svp');
    }
}
