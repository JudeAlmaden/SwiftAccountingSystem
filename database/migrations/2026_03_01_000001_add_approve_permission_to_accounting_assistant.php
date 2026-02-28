<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Find the accounting assistant role
        $accountingAssistant = Role::where('name', 'accounting assistant')->first();
        
        if ($accountingAssistant) {
            // Find or create the approve journals permission
            $approvePermission = Permission::firstOrCreate(['name' => 'approve journals']);
            
            // Give the permission to accounting assistant
            $accountingAssistant->givePermissionTo($approvePermission);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Find the accounting assistant role
        $accountingAssistant = Role::where('name', 'accounting assistant')->first();
        
        if ($accountingAssistant) {
            // Revoke the permission
            $accountingAssistant->revokePermissionTo('approve journals');
        }
    }
};
