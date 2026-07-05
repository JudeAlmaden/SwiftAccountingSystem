<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // We will be deleting everything first to prevent duplicates while seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate in correct order
        User::truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('role_has_permissions')->truncate();
        Permission::truncate();
        Role::truncate();

        // Re-enable FK checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        /* ========================================================================== */
        // List of currently available roles
        $admin = Role::create(['name' => 'admin']);
        $accountingAssistant = Role::create(['name' => 'accounting assistant']);
        $accountingHead = Role::create(['name' => 'accounting head']);
        $auditor = Role::create(['name' => 'auditor']);
        $svp = Role::create(['name' => 'SVP']);

        // Define Permissions
        $permissions = [
            // User Management
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Chart of Accounts
            'view accounts',
            'create accounts',
            'edit accounts',
            'delete accounts',

            // Journals
            'view journals',
            'create journals',
            'edit journals',
            'delete journals',
            'approve journals',
            'release journals',

            // Control number prefixes (accounting head)
            'manage control number prefixes',

            // Audit
            'view audit trails',

            // Inventory
            'view inventory',
            'create inventory',
            'edit inventory',
            'verify inventory',

            // Reports
            'create trial balance',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        /* ========================================================================== */
        // Assign Permissions to Roles

        // Admin: User Management and View Journals only + View Accounts + Audit Trails
        $admin->givePermissionTo([
            'view users', 'create users', 'edit users', 'delete users',
            'view journals',
            'view accounts',
            'view audit trails',
        ]);

        // Accounting Assistant: Create/View Journals, View Accounts, Approve (for final step)
        $accountingAssistant->givePermissionTo([
            'view accounts',
            'view journals',
            'create journals',
            'approve journals',
            'release journals',
            'view inventory',
            'create inventory',
            'edit inventory',
        ]);

        // Accounting Head: Accounts & Journals (Full access) + manage control number prefixes
        $accountingHead->givePermissionTo([
            'view accounts', 'create accounts', 'edit accounts', 'delete accounts',
            'view journals', 'create journals', 'edit journals', 'delete journals', 'approve journals', 'release journals',
            'manage control number prefixes',
            'create trial balance',
            'view inventory', 'create inventory', 'edit inventory',
        ]);

        // Auditor: Read-only access + Audit Trails
        $auditor->givePermissionTo([
            'view accounts',
            'view journals',
            'approve journals',
            'create trial balance',
            'view audit trails',
            'view inventory',
            'verify inventory',
        ]);

        // SVP: View & Approve Journals
        $svp->givePermissionTo([
            'view accounts',
            'view journals',
            'approve journals',
            'view inventory',
        ]);
    }
}
