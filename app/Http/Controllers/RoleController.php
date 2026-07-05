<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    private const SYSTEM_ROLES = ['admin', 'accounting assistant', 'accounting head', 'auditor', 'SVP'];

    /**
     * Map of required dependencies for permissions.
     * E.g., if you have 'create users', you must have 'view users'.
     */
    private const DEPENDENCIES = [
        'create users' => ['view users'],
        'edit users' => ['view users'],
        'delete users' => ['view users'],

        'create accounts' => ['view accounts'],
        'edit accounts' => ['view accounts'],
        'delete accounts' => ['view accounts'],

        'create journals' => ['view journals'],
        'edit journals' => ['view journals'],
        'delete journals' => ['view journals'],
        'approve journals' => ['view journals'],
        'release journals' => ['view journals'],

        'create inventory' => ['view inventory'],
        'edit inventory' => ['view inventory'],
        'verify inventory' => ['view inventory'],
        'delete inventory' => ['view inventory'],
    ];

    /**
     * Default permissions for system roles (used for factory reset).
     */
    private const DEFAULT_PERMISSIONS = [
        'admin' => [
            'view users', 'create users', 'edit users', 'delete users',
            'view journals',
            'view accounts',
            'view audit trails',
        ],
        'accounting assistant' => [
            'view accounts',
            'view journals',
            'create journals',
            'approve journals',
            'release journals',
            'view inventory', 'create inventory', 'edit inventory',
        ],
        'accounting head' => [
            'view accounts', 'create accounts', 'edit accounts', 'delete accounts',
            'view journals', 'create journals', 'edit journals', 'delete journals', 'approve journals', 'release journals',
            'manage control number prefixes',
            'create trial balance',
            'view inventory', 'create inventory', 'edit inventory',
        ],
        'auditor' => [
            'view accounts',
            'view journals',
            'approve journals',
            'create trial balance',
            'view audit trails',
            'view inventory', 'verify inventory',
        ],
        'SVP' => [
            'view accounts',
            'view journals',
            'approve journals',
            'view inventory',
        ],
    ];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        $permissionsToSync = $this->resolveDependencies($validated['permissions'] ?? []);
        $role->syncPermissions($permissionsToSync);

        return redirect()->back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, Role $role)
    {
        $isSystemRole = in_array($role->name, self::SYSTEM_ROLES);

        $rules = [
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ];

        // Only allow renaming if it's not a system role
        if (! $isSystemRole) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)];
        }

        $validated = $request->validate($rules);

        if (! $isSystemRole && isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        $permissionsToSync = $this->resolveDependencies($validated['permissions'] ?? []);
        $role->syncPermissions($permissionsToSync);

        return redirect()->back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if (in_array($role->name, self::SYSTEM_ROLES)) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete a system role.']);
        }

        if (User::role($role->name)->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete role because it is assigned to one or more users.']);
        }

        $role->delete();

        return redirect()->back()->with('success', 'Role deleted successfully.');
    }

    public function reset(Role $role)
    {
        if (! in_array($role->name, self::SYSTEM_ROLES)) {
            return redirect()->back()->withErrors(['error' => 'Can only reset system roles.']);
        }

        $defaults = self::DEFAULT_PERMISSIONS[$role->name] ?? [];
        $role->syncPermissions($defaults);

        return redirect()->back()->with('success', "Role '{$role->name}' has been reset to system defaults.");
    }

    /**
     * Given an array of permission names, ensure all dependencies are included.
     */
    private function resolveDependencies(array $permissions): array
    {
        $finalPermissions = [];

        foreach ($permissions as $permission) {
            $finalPermissions[] = $permission;

            if (isset(self::DEPENDENCIES[$permission])) {
                foreach (self::DEPENDENCIES[$permission] as $dep) {
                    $finalPermissions[] = $dep;
                }
            }
        }

        return array_unique($finalPermissions);
    }
}
