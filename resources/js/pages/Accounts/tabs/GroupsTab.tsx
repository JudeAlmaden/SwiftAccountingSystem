import { usePage } from "@inertiajs/react";
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

export default function GroupsTab() {
    // Get CSRF token
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const { user } = usePage<SharedData>().props;
    const permissions = user.permissions || [];
    const canManageGroups = permissions.includes('create accounts');

    const [groups, setGroups] = useState<AccountGroup[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
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

    const fetchGroups = () => {
        setIsLoadingGroups(true);
        fetch(route('account-groups.index') + '?all=true', {
            headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': token },
        })
            .then(res => res.json())
            .then(data => {
                setGroups(data.data || []);
                setIsLoadingGroups(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingGroups(false);
            });
    }

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleGroupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingGroup(true);
        setGroupErrors({});
        const url = (groupForm as any).id
            ? route('account-groups.update', (groupForm as any).id)
            : route('account-groups.store');
        const method = (groupForm as any).id ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
            body: JSON.stringify(groupForm),
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 422) setGroupErrors(data.errors);
                    else alert('Error saving group');
                    throw new Error('Validation failed');
                }
                return data;
            })
            .then(() => {
                setIsGroupCreateOpen(false);
                setGroupForm({ name: '', grp_code: '', account_type: '', sub_account_type: '' });
                fetchGroups();
            })
            .catch(() => { })
            .finally(() => setIsCreatingGroup(false));
    };

    const handleDeleteGroup = (group: AccountGroup) => {
        if (!canManageGroups) return;
        if (group.accounts_count && group.accounts_count > 0) {
            alert('Cannot delete this group because it has associated accounts.');
            return;
        }
        if (!confirm('Are you sure you want to delete this group?')) return;

        fetch(route('account-groups.destroy', group.id), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(async res => {
                if (res.ok) fetchGroups();
                else {
                    const data = await res.json();
                    alert(data.message || 'Failed to delete group');
                }
            });
    }

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
                        {isLoadingGroups ? (
                            <TableRow><TableCell colSpan={5} className="text-center p-4">Loading...</TableCell></TableRow>
                        ) : groups.length === 0 ? (
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
                                                <SelectItem value="Contingent Liabilities">Contingent Liabilities</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Equity' && (
                                            <>
                                                <SelectItem value="Capital">Capital</SelectItem>
                                                <SelectItem value="Retained Earnings">Retained Earnings</SelectItem>
                                                <SelectItem value="Contra Equity">Contra Equity</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Revenue' && (
                                            <>
                                                <SelectItem value="Operating Revenue">Operating Revenue</SelectItem>
                                                <SelectItem value="Non-Operating Revenue">Non-Operating Revenue</SelectItem>
                                                <SelectItem value="Contra Revenue">Contra Revenue</SelectItem>
                                            </>
                                        )}
                                        {groupForm.account_type === 'Expenses' && (
                                            <>
                                                <SelectItem value="Operating Expenses">Operating Expenses</SelectItem>
                                                <SelectItem value="Non-Operating Expenses">Non-Operating Expenses</SelectItem>
                                                <SelectItem value="Cost of Goods Sold">Cost of Goods Sold</SelectItem>
                                                <SelectItem value="Contra Expenses">Contra Expenses</SelectItem>
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
