import { useState, useEffect } from 'react';
import { DottedSeparator } from '@/components/dotted-line';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Permission } from '@/types/database';

interface RoleFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSaving: boolean;
    roleForm: {
        id: number;
        name: string;
        permissions: string[];
    };
    systemRoles: string[];
    formErrors: any;
    allPermissions: Permission[];
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (field: string, value: any) => void;
}

const DEPENDENCIES: Record<string, string[]> = {
    'create users': ['view users'],
    'edit users': ['view users'],
    'delete users': ['view users'],
    
    'create accounts': ['view accounts'],
    'edit accounts': ['view accounts'],
    'delete accounts': ['view accounts'],
    
    'create journals': ['view journals'],
    'edit journals': ['view journals'],
    'delete journals': ['view journals'],
    'approve journals': ['view journals'],
    'release journals': ['view journals'],
    
    'create inventory': ['view inventory'],
    'edit inventory': ['view inventory'],
    'verify inventory': ['view inventory'],
    'delete inventory': ['view inventory'],
};

export function RoleFormModal({
    isOpen,
    onOpenChange,
    isEditing,
    isSaving,
    roleForm,
    systemRoles,
    formErrors,
    allPermissions,
    onSubmit,
    onFormChange,
}: RoleFormModalProps) {
    const isSystemRole = systemRoles.includes(roleForm.name);

    // Group permissions by prefix (e.g., 'view users' -> 'users')
    const groupedPermissions: Record<string, Permission[]> = {};
    allPermissions.forEach(p => {
        const parts = p.name.split(' ');
        const group = parts.length > 1 ? parts.slice(1).join(' ') : 'other';
        if (!groupedPermissions[group]) groupedPermissions[group] = [];
        groupedPermissions[group].push(p);
    });

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        let newPermissions = new Set(roleForm.permissions);

        if (checked) {
            newPermissions.add(permissionName);
            // Apply dependencies (if checking 'create users', auto-check 'view users')
            if (DEPENDENCIES[permissionName]) {
                DEPENDENCIES[permissionName].forEach(dep => newPermissions.add(dep));
            }
        } else {
            // Cannot uncheck if another checked permission depends on this one
            const isDependencyForOthers = Object.entries(DEPENDENCIES).some(([key, deps]) => 
                deps.includes(permissionName) && newPermissions.has(key)
            );
            
            if (!isDependencyForOthers) {
                newPermissions.delete(permissionName);
            }
        }

        onFormChange('permissions', Array.from(newPermissions));
    };

    const isPermissionDisabled = (permissionName: string) => {
        // If it's a dependency for another currently checked permission, it's disabled (cannot be unchecked)
        return Object.entries(DEPENDENCIES).some(([key, deps]) => 
            deps.includes(permissionName) && roleForm.permissions.includes(key)
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className='px-6 py-5 bg-white border-b border-gray-100'>
                    <DialogTitle className='text-2xl font-semibold text-gray-900 flex items-center gap-2'>
                        {isEditing ? <ShieldCheck className="w-6 h-6 text-[#16c42d]" /> : <ShieldAlert className="w-6 h-6 text-gray-500" />}
                        {isEditing ? 'Edit Role' : 'Create Custom Role'}
                    </DialogTitle>
                    <DialogDescription className='text-sm text-gray-500'>
                        {isEditing ? 'Update role name and permissions.' : 'Define a new role and assign its capabilities.'}
                        {isSystemRole && <span className="block mt-2 text-[#02310b] font-medium bg-[#e8f3ea] px-3 py-2 rounded-md inline-block border border-[#d1e9d5]">This is a system role. You can only edit its permissions.</span>}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={onSubmit} className="space-y-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role_name">Role Name</Label>
                            <Input
                                id="role_name"
                                value={roleForm.name}
                                onChange={e => onFormChange('name', e.target.value)}
                                disabled={isEditing && isSystemRole}
                                required
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all max-w-md'
                                placeholder='e.g., Senior Auditor'
                            />
                            {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name[0]}</p>}
                        </div>

                        <div>
                            <Label className="text-base font-semibold mb-3 block text-gray-900">Role Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {Object.entries(groupedPermissions).map(([group, perms]) => (
                                    <div key={group} className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
                                        <h4 className="font-semibold text-sm text-gray-800 capitalize border-b border-gray-100 pb-2 flex items-center justify-between">
                                            {group}
                                            <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200/50">{perms.length} perms</span>
                                        </h4>
                                        <div className="space-y-2.5 pt-1">
                                            {perms.map(p => {
                                                const isChecked = roleForm.permissions.includes(p.name);
                                                const disabled = isPermissionDisabled(p.name);
                                                
                                                return (
                                                    <div key={p.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-gray-50 transition-colors">
                                                        <Checkbox 
                                                            id={`perm-${p.id}`} 
                                                            checked={isChecked}
                                                            disabled={disabled}
                                                            className="data-[state=checked]:bg-[#16c42d] data-[state=checked]:border-[#16c42d]"
                                                            onCheckedChange={(checked) => handlePermissionToggle(p.name, checked as boolean)}
                                                        />
                                                        <label 
                                                            htmlFor={`perm-${p.id}`} 
                                                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${disabled ? 'text-gray-400' : 'cursor-pointer text-gray-700'}`}
                                                        >
                                                            {p.name}
                                                            {disabled && isChecked && <span className="ml-2 text-[10px] uppercase text-[#16c42d] font-bold bg-[#e8f3ea] px-1.5 py-0.5 rounded-sm border border-[#d1e9d5]">(Auto)</span>}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
                <DialogFooter className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="shadow-sm font-semibold">Cancel</Button>
                    <Button type="submit" disabled={isSaving} onClick={onSubmit} className="bg-[#16c42d] hover:bg-[#13a827] text-white shadow-sm font-semibold">
                        {isSaving ? 'Saving...' : 'Save Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
