import { DottedSeparator } from '@/components/dotted-line';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Role, Permission } from '@/types/database';

const ACCOUNT_PERMISSIONS = [
    'view accounts',
    'create accounts',
    'edit accounts',
    'delete accounts',
    'manage control number prefixes',
];

interface UserFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSaving: boolean;
    currentUserId: number | null;
    currentUser: any;
    userForm: {
        id: number;
        name: string;
        account_number: string;
        email: string;
        role: string;
        status: string;
        password: string;
        password_confirmation: string;
        permissions: string[];
    };
    formErrors: any;
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (field: string, value: any) => void;
    availableRoles: Role[];
    availablePermissions: Permission[];
}

export function UserFormModal({
    isOpen,
    onOpenChange,
    isEditing,
    isSaving,
    currentUserId,
    currentUser,
    userForm,
    formErrors,
    onSubmit,
    onFormChange,
    availableRoles,
    availablePermissions
}: UserFormModalProps) {

    const handlePermissionChange = (permissionName: string, checked: boolean) => {
        let newPermissions = [...(userForm.permissions || [])];
        if (checked) {
            newPermissions.push(permissionName);
        } else {
            newPermissions = newPermissions.filter(p => p !== permissionName);
        }
        onFormChange('permissions', newPermissions);
    };

    const selectedRole = availableRoles.find(r => r.name === userForm.role);
    const permissionsFromRole = selectedRole?.permissions?.map(p => p.name) ?? [];
    const hasPermission = (permissionName: string) =>
        (userForm.permissions?.includes(permissionName) ?? false) || permissionsFromRole.includes(permissionName);

    const isAdmin = (currentUser?.roles ?? []).some((r: { name: string }) => r.name === 'admin');
    const isAccountPermission = (name: string) => ACCOUNT_PERMISSIONS.includes(name);
    const isFromRole = (permissionName: string) => permissionsFromRole.includes(permissionName);
    const isPermissionDisabled = (permission: Permission) =>
        userForm.role === 'admin' ||
        isFromRole(permission.name) ||
        (isAccountPermission(permission.name) && !isAdmin);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
                <DialogHeader className='px-6 pt-6 gap-1'>
                    <DialogTitle className='text-2xl text-table-head pt-1'>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
                    <DialogDescription className='text-sm'>
                        {isEditing ? 'Update user details and permissions.' : 'Create a new user account.'}
                    </DialogDescription>
                </DialogHeader>
                <DottedSeparator />
                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={userForm.name}
                                onChange={e => onFormChange('name', e.target.value)}
                                required
                                className='border-gray-300 border-[1.7px] rounded-sm'
                                placeholder='Justine Jude Almaden'
                            />
                            {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="account_number">Employee Number</Label>
                            <Input
                                id="account_number"
                                value={userForm.account_number}
                                onChange={e => onFormChange('account_number', e.target.value)}
                                required
                                className='border-gray-300 border-[1.7px] rounded-sm'
                                placeholder='000-0000'
                            />
                            {formErrors.account_number && <p className="text-red-500 text-sm">{formErrors.account_number[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={userForm.email}
                                onChange={e => onFormChange('email', e.target.value)}
                                className='border-gray-300 border-[1.7px] rounded-sm'
                                placeholder='example@gmail.com'
                            />
                            {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={userForm.role}
                                onValueChange={(val) => onFormChange('role', val === 'none' ? '' : val)}
                                disabled={isEditing && currentUserId === currentUser?.id}
                            >
                                <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Role</SelectItem>
                                    {availableRoles.map(role => (
                                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.role && <p className="text-red-500 text-sm">{formErrors.role[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={userForm.status}
                                onValueChange={(val) => onFormChange('status', val)}
                                disabled={isEditing && currentUserId === currentUser?.id}
                            >
                                <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password {isEditing && '(Leave blank to keep current)'}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={userForm.password}
                                onChange={e => onFormChange('password', e.target.value)}
                                className='border-gray-300 border-[1.7px] rounded-sm'
                            />
                            {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={userForm.password_confirmation}
                                onChange={e => onFormChange('password_confirmation', e.target.value)}
                                className='border-gray-300 border-[1.7px] rounded-sm'
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Direct Permissions</Label>
                            <div className="border border-gray-300 rounded-sm p-4 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {availablePermissions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-2">No permissions available.</p>
                                ) : (
                                    availablePermissions.map(permission => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                disabled={!selectedRole || isPermissionDisabled(permission)   }
                                                id={`perm-${permission.id}`}
                                                checked={hasPermission(permission.name)}
                                                onCheckedChange={(checked) => handlePermissionChange(permission.name, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={`perm-${permission.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {permission.name}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Select direct permissions for users without a specific role or to override role defaults.</p>
                        </div>
                    </form>
                </div>
                <DialogFooter className="px-6 pb-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSaving} onClick={onSubmit}>
                        {isSaving ? 'Saving...' : 'Save User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
