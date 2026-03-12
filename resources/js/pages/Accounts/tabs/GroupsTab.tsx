import { usePage, router } from "@inertiajs/react";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SharedData } from "@/types";

interface AccountGroup {
    id: number;
    name: string;
    grp_code: string | null;
    account_type: string;
    sub_account_type: string | null;
    accounts_count?: number;
}

interface GroupsTabProps {
    initialGroups: AccountGroup[];
}

export default function GroupsTab({ initialGroups }: GroupsTabProps) {
    const { auth, user: propsUser } = usePage<any>().props;
    const user = auth?.user || propsUser || {};
    const permissions = user?.permissions || [];
    const canManageGroups = permissions.includes('create accounts');

    const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
    const [groupForm, setGroupForm] = useState<{
        id?: number;
        name: string;
        grp_code: string;
        account_type: string;
        sub_account_type: string;
    }>({
        name: '',
        grp_code: '',
        account_type: '',
        sub_account_type: '',
    });
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupErrors, setGroupErrors] = useState<any>({});

    const handleGroupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingGroup(true);
        setGroupErrors({});

        const isUpdate = !!groupForm.id;
        const submitRoute = isUpdate
            ? route('account-groups.update', groupForm.id!)
            : route('account-groups.store');

        if (isUpdate) {
            router.put(submitRoute, groupForm, {
                onSuccess: () => {
                    setIsGroupCreateOpen(false);
                    setGroupForm({ name: '', grp_code: '', account_type: '', sub_account_type: '' });
                },
                onError: (errors) => setGroupErrors(errors),
                onFinish: () => setIsCreatingGroup(false)
            });
        } else {
            router.post(submitRoute, groupForm, {
                onSuccess: () => {
                    setIsGroupCreateOpen(false);
                    setGroupForm({ name: '', grp_code: '', account_type: '', sub_account_type: '' });
                },
                onError: (errors) => setGroupErrors(errors),
                onFinish: () => setIsCreatingGroup(false)
            });
        }
    };

    const handleDeleteGroup = (group: AccountGroup) => {
        if (!canManageGroups) return;
        if (group.accounts_count && group.accounts_count > 0) {
            alert('Cannot delete this group because it has associated accounts.');
            return;
        }
        if (!confirm('Are you sure you want to delete this group?')) return;

        router.delete(route('account-groups.destroy', group.id), {
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                alert(firstError || 'Failed to delete group');
            }
        });
    }

    const groups = initialGroups;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                {canManageGroups && (
                    <Button onClick={() => {
                        setGroupForm({ name: '', grp_code: '', account_type: '', sub_account_type: '' });
                        setIsGroupCreateOpen(true);
                    }}>
                        Add Group
                    </Button>
                )}
            </div>
            <div className="rounded-sm border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-table-head hover:bg-table-head border-0">
                            <TableHead className="text-white font-extrabold px-4">GRP Code</TableHead>
                            <TableHead className="text-white font-extrabold px-4">Name</TableHead>
                            <TableHead className="text-white font-extrabold px-4">Type</TableHead>
                            <TableHead className="text-white font-extrabold px-4">Sub-Type</TableHead>
                            <TableHead className="text-white font-extrabold px-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center p-4 text-muted-foreground">No groups found.</TableCell></TableRow>
                        ) : (
                            groups.map(group => (
                                <TableRow key={group.id}>
                                    <TableCell className="px-4">{group.grp_code || '-'}</TableCell>
                                    <TableCell className="px-4 font-medium">{group.name}</TableCell>
                                    <TableCell className="px-4">{group.account_type}</TableCell>
                                    <TableCell className="px-4">{group.sub_account_type || '-'}</TableCell>
                                    <TableCell className="px-4 text-right space-x-2">
                                        {canManageGroups && (
                                            <>
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setGroupForm({
                                                        id: group.id,
                                                        name: group.name,
                                                        grp_code: group.grp_code || '',
                                                        account_type: group.account_type,
                                                        sub_account_type: group.sub_account_type || ''
                                                    });
                                                    setIsGroupCreateOpen(true);
                                                }}>Edit</Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500"
                                                    onClick={() => handleDeleteGroup(group)}
                                                    disabled={!!(group.accounts_count && group.accounts_count > 0)}
                                                    title={group.accounts_count && group.accounts_count > 0 ? "Cannot delete group with accounts" : "Delete group"}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isGroupCreateOpen} onOpenChange={setIsGroupCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{(groupForm as any).id ? 'Edit Group' : 'Create Group'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGroupSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Group Name</Label>
                            <Input
                                value={groupForm.name}
                                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                                required
                            />
                            {groupErrors.name && <p className="text-red-500 text-sm">{groupErrors.name[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>GRP Code</Label>
                            <Input
                                value={groupForm.grp_code || ''}
                                onChange={e => setGroupForm({ ...groupForm, grp_code: e.target.value })}
                            />
                            {groupErrors.grp_code && <p className="text-red-500 text-sm">{groupErrors.grp_code[0]}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Account Type</Label>
                            <Select
                                value={groupForm.account_type}
                                onValueChange={v => setGroupForm({ ...groupForm, account_type: v, sub_account_type: '' })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {groupErrors.account_type && <p className="text-red-500 text-sm">{groupErrors.account_type[0]}</p>}
                        </div>

                        {groupForm.account_type && (
                            <div className="grid gap-2">
                                <Label>Sub-Account Type</Label>
                                <Select
                                    value={groupForm.sub_account_type}
                                    onValueChange={v => setGroupForm({ ...groupForm, sub_account_type: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select sub-type" /></SelectTrigger>
                                    <SelectContent>
                                        {groupForm.account_type === 'Assets' && (
                                            <>
                                                <SelectItem value="Current Assets">Current Assets</SelectItem>
                                                <SelectItem value="Non-Current Assets">Non-Current Assets</SelectItem>
                                                <SelectItem value="Contra Assets">Contra Assets</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Liabilities' && (
                                            <>
                                                <SelectItem value="Current Liabilities">Current Liabilities</SelectItem>
                                                <SelectItem value="Non-Current Liabilities">Non-Current Liabilities</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Equity' && (
                                            <>
                                                <SelectItem value="Capital">Capital</SelectItem>
                                                <SelectItem value="Retained Earnings">Retained Earnings</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Revenue' && (
                                            <>
                                                <SelectItem value="Operating Revenue">Operating Revenue</SelectItem>
                                                <SelectItem value="Contra Revenue">Contra Revenue</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Expenses' && (
                                            <>
                                                <SelectItem value="Operating Expenses">Operating Expenses</SelectItem>
                                                <SelectItem value="Non-Operating Expenses">Non-Operating Expenses</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsGroupCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isCreatingGroup}>Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
