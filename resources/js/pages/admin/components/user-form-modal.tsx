import { DottedSeparator } from '@/components/dotted-line';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, UserCog } from 'lucide-react';
import type { Role } from '@/types/database';


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
    };
    formErrors: any;
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (field: string, value: any) => void;
    availableRoles: Role[];
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
}: UserFormModalProps) {


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
                <DialogHeader className='px-6 py-5 bg-white border-b border-gray-100'>
                    <DialogTitle className='text-2xl font-semibold text-gray-900 flex items-center gap-2'>
                        {isEditing ? <UserCog className="w-6 h-6 text-[#16c42d]" /> : <UserPlus className="w-6 h-6 text-gray-500" />}
                        {isEditing ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription className='text-sm text-gray-500'>
                        {isEditing ? 'Update user details.' : 'Create a new user account.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6">
                    <form onSubmit={onSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={userForm.name}
                                onChange={e => onFormChange('name', e.target.value)}
                                required
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all'
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
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all'
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
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all'
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
                                required={!isEditing}
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all'
                                placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter a strong password'}
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
                                required={!isEditing || userForm.password !== ''}
                                className='border-gray-300/80 rounded-lg shadow-sm focus-visible:ring-[#16c42d] focus-visible:border-[#16c42d] transition-all'
                                placeholder='Confirm password'
                            />
                        </div>

                    </form>
                </div>
                <DialogFooter className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="shadow-sm font-semibold">Cancel</Button>
                    <Button type="submit" disabled={isSaving} onClick={onSubmit} className="bg-[#16c42d] hover:bg-[#13a827] text-white shadow-sm font-semibold">
                        {isSaving ? 'Saving...' : 'Save User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
