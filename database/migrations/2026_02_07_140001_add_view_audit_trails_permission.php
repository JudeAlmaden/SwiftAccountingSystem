<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $guard = 'web';
        $permissionId = DB::table('permissions')->where('name', 'view audit trails')->where('guard_name', $guard)->value('id');
        if (!$permissionId) {
            $permissionId = DB::table('permissions')->insertGetId(['name' => 'view audit trails', 'guard_name' => $guard]);
        }
        $roleIds = DB::table('roles')->whereIn('name', ['admin', 'auditor'])->where('guard_name', $guard)->pluck('id');
        foreach ($roleIds as $roleId) {
            $exists = DB::table('role_has_permissions')
                ->where('permission_id', $permissionId)
                ->where('role_id', $roleId)
                ->exists();
            if (!$exists) {
                DB::table('role_has_permissions')->insert(['permission_id' => $permissionId, 'role_id' => $roleId]);
            }
        }
    }

    public function down(): void
    {
        $permId = DB::table('permissions')->where('name', 'view audit trails')->value('id');
        if ($permId) {
            DB::table('role_has_permissions')->where('permission_id', $permId)->delete();
            DB::table('permissions')->where('id', $permId)->delete();
        }
    }
};
