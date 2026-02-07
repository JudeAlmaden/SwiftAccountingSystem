<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //We will be deleting everything first to prevent duplicates while seeding 
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

        /*==========================================================================*/
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

            // Disbursements
            'view disbursements',
            'create disbursements',
            'edit disbursements',
            'delete disbursements',
            'approve disbursements',
            'release disbursements', // If applicable

            // Control number prefixes (accounting head)
            'manage control number prefixes',

            // Audit
            'view audit trails',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        /*==========================================================================*/
        // Assign Permissions to Roles

        // Admin: User Management and View Disbursements only + View Accounts + Audit Trails
        $admin->givePermissionTo([
            'view users', 'create users', 'edit users', 'delete users',
            'view disbursements',
            'view accounts',
            'view audit trails',
        ]);

        // Accounting Assistant: Create/View Disbursements, View Accounts
        $accountingAssistant->givePermissionTo([
            'view accounts',
            'view disbursements', 
            'create disbursements'
        ]);

        // Accounting Head: Accounts & Disbursements (Full access) + manage control number prefixes
        $accountingHead->givePermissionTo([
            'view accounts', 'create accounts', 'edit accounts', 'delete accounts',
            'view disbursements', 'create disbursements', 'edit disbursements', 'delete disbursements', 'approve disbursements', 'release disbursements',
            'manage control number prefixes'
        ]);
                
        // Auditor: Read-only access + Audit Trails
        $auditor->givePermissionTo([
            'view accounts',
            'view disbursements',
            'approve disbursements',
            'view audit trails',
        ]);

        // SVP: View & Approve Disbursements
        $svp->givePermissionTo([
            'view accounts',
            'view disbursements',
            'approve disbursements',
            'release disbursements'
        ]);
    }
}
