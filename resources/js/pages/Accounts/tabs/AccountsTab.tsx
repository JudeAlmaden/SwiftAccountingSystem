import { usePage } from "@inertiajs/react";
import { Link } from "@inertiajs/react";
import { Check, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { route } from "ziggy-js";
import { DottedSeparator } from "@/components/dotted-line";
import { StatusIndicator } from "@/components/status-indicator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SharedData } from "@/types";
import type { Account } from "@/types/database";

interface AccountGroup {
    id: number;
    name: string;
    grp_code: string | null;
    account_type: string;
    sub_account_type: string | null;
    accounts_count?: number;
}

export default function AccountsTab() {
    const { user } = usePage<SharedData>().props;
    const permissions = user.permissions || [];
    const canCreate = permissions.includes('create accounts');
    const canDelete = permissions.includes('delete accounts');

    // Get CSRF token
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    // State for accounts (paginated data)
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        next_page_url: null as string | null,
        prev_page_url: null as string | null,
        total: 0,
        from: 0,
        to: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Search State
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Debounced or triggered search value

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        account_name: '',
        account_code: '',
        account_type: '',
        sub_account_type: '',
        account_description: '',
        account_normal_side: '',
        account_group_id: '',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createErrors, setCreateErrors] = useState<any>({});

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Group State for dropdown
    const [groups, setGroups] = useState<AccountGroup[]>([]);

    const fetchGroups = () => {
        fetch(route('account-groups.index') + '?all=true', {
            headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': token },
        })
            .then(res => res.json())
            .then(data => {
                setGroups(data.data || []);
            })
            .catch(err => {
                console.error(err);
            });
    }

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchAccounts = (url?: string | null) => {
        setIsLoading(true);
        // Construct URL with search param
        const targetUrl = new URL(url || route('accounts.index'));
        if (searchQuery) {
            targetUrl.searchParams.set('search', searchQuery);
        }

        fetch(targetUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(res => res.json())
            .then(data => {
                setAccounts(data.data);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    next_page_url: data.next_page_url,
                    prev_page_url: data.prev_page_url,
                    total: data.total,
                    from: data.from,
                    to: data.to,
                });
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch accounts', err);
                setIsLoading(false);
            });
    };

    // Debounce search effect or just simple effect for now
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(search);
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Fetch when searchQuery changes
    useEffect(() => {
        fetchAccounts();
    }, [searchQuery]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateErrors({});

        fetch(route('accounts.store'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
            body: JSON.stringify(createForm),
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 422) {
                        setCreateErrors(data.errors);
                    } else {
                        alert('Error creating account');
                    }
                    throw new Error('Validation failed');
                }
                return data;
            })
            .then(() => {
                setIsCreateOpen(false);
                setCreateForm({
                    account_name: '',
                    account_code: '',
                    account_type: '',
                    sub_account_type: '',
                    account_description: '',
                    account_normal_side: '',
                    account_group_id: '',
                });
                fetchAccounts();
            })
            .catch(() => { })
            .finally(() => setIsCreating(false));
    };

    const handleDelete = () => {
        if (!accountToDelete) return;

        setIsDeleting(true);
        fetch(route('accounts.destroy', accountToDelete.id), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(async res => {
                const data = await res.json();
                if (res.ok) {
                    setIsDeleteOpen(false);
                    setAccountToDelete(null);
                    fetchAccounts(); // Refresh
                } else {
                    alert(data.message || 'Failed to delete account');
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsDeleting(false));
    };

    const handleToggleStatus = (id: number) => {
        fetch(route('accounts.toggleStatus', id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(res => {
                if (res.ok) {
                    fetchAccounts();
                } else {
                    alert('Failed to toggle status');
                }
            })
            .catch(err => console.error(err));
    };

    const confirmDelete = (account: Account) => {
        setAccountToDelete(account);
        setIsDeleteOpen(true);
    };

    const filteredGroups = groups.filter(g =>
        !createForm.account_type || g.account_type === createForm.account_type
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 mb-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search accounts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-lg rounded-sm border-gray-300 border-[1.7px] bg-white pl-9"
                />

                {canCreate && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Add Account</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader className='gap-1'>
                                <DialogTitle className='text-2xl text-table-head pt-1'>Create New Account</DialogTitle>
                                <DialogDescription className='text-sm'>
                                    Add a new account to your chart of accounts
                                </DialogDescription>
                            </DialogHeader>
                            <DottedSeparator className='mb-2' />
                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="account_name">Account Name</Label>
                                    <Input
                                        id="account_name"
                                        value={createForm.account_name}
                                        onChange={e => setCreateForm({ ...createForm, account_name: e.target.value })}
                                        placeholder="e.g. Cash on Hand"
                                        required
                                        className='border-gray-300 border-[1.7px] rounded-sm'
                                    />
                                    {createErrors.account_name && <p className="text-red-500 text-sm">{createErrors.account_name[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_code">Account Code</Label>
                                    <Input
                                        id="account_code"
                                        value={createForm.account_code}
                                        onChange={e => setCreateForm({ ...createForm, account_code: e.target.value })}
                                        placeholder="e.g. 1001"
                                        required
                                        className='border-gray-300 border-[1.7px] rounded-sm'
                                    />
                                    {createErrors.account_code && <p className="text-red-500 text-sm">{createErrors.account_code[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_type">Account Type</Label>
                                    <Select
                                        value={createForm.account_type}
                                        onValueChange={(value) =>
                                            setCreateForm({ ...createForm, account_type: value, sub_account_type: '', account_group_id: '' })
                                        }
                                    >
                                        <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                            <SelectValue placeholder="e.g. Assets" />
                                        </SelectTrigger>
                                        <SelectContent className='border-gray-300 border-[1.7px] rounded-sm'>
                                            {['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'].map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {createErrors.account_type && <p className="text-red-500 text-sm">{createErrors.account_type[0]}</p>}
                                </div>

                                {createForm.account_type && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="account_group">Account Group (Optional)</Label>
                                        <Select
                                            value={createForm.account_group_id || "none"}
                                            onValueChange={(value) =>
                                                setCreateForm({ ...createForm, account_group_id: value === "none" ? "" : value })
                                            }
                                        >
                                            <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                                <SelectValue placeholder="Select a group..." />
                                            </SelectTrigger>
                                            <SelectContent className='border-gray-300 border-[1.7px] rounded-sm'>
                                                <SelectItem value="none">None</SelectItem>
                                                {filteredGroups.map(g => (
                                                    <SelectItem key={g.id} value={g.id.toString()}>
                                                        {g.name} {g.grp_code ? `(${g.grp_code})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {createForm.account_type && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="sub_account_type">Sub-Account Type</Label>
                                        <Select
                                            value={createForm.sub_account_type}
                                            onValueChange={(value) =>
                                                setCreateForm({ ...createForm, sub_account_type: value })
                                            }
                                        >
                                            <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                                <SelectValue placeholder="Select sub-type..." />
                                            </SelectTrigger>
                                            <SelectContent className='border-gray-300 border-[1.7px] rounded-sm'>
                                                {createForm.account_type === 'Assets' && (
                                                    <>
                                                        <SelectItem value="Current Assets">Current Assets</SelectItem>
                                                        <SelectItem value="Non-Current Assets">Non-Current Assets</SelectItem>
                                                        <SelectItem value="Contra Assets">Contra Assets</SelectItem>
                                                    </>
                                                )}
                                                {createForm.account_type === 'Liabilities' && (
                                                    <>
                                                        <SelectItem value="Current Liabilities">Current Liabilities</SelectItem>
                                                        <SelectItem value="Non-Current Liabilities">Non-Current Liabilities</SelectItem>
                                                        <SelectItem value="Contingent Liabilities">Contingent Liabilities</SelectItem>
                                                    </>
                                                )}
                                                {createForm.account_type === 'Equity' && (
                                                    <>
                                                        <SelectItem value="Capital">Capital</SelectItem>
                                                        <SelectItem value="Retained Earnings">Retained Earnings</SelectItem>
                                                        <SelectItem value="Contra Equity">Contra Equity</SelectItem>
                                                    </>
                                                )}
                                                {createForm.account_type === 'Revenue' && (
                                                    <>
                                                        <SelectItem value="Operating Revenue">Operating Revenue</SelectItem>
                                                        <SelectItem value="Non-Operating Revenue">Non-Operating Revenue</SelectItem>
                                                        <SelectItem value="Contra Revenue">Contra Revenue</SelectItem>
                                                    </>
                                                )}
                                                {createForm.account_type === 'Expenses' && (
                                                    <>
                                                        <SelectItem value="Operating Expenses">Operating Expenses</SelectItem>
                                                        <SelectItem value="Non-Operating Expenses">Non-Operating Expenses</SelectItem>
                                                        <SelectItem value="Cost of Goods Sold">Cost of Goods Sold</SelectItem>
                                                        <SelectItem value="Contra Expenses">Contra Expenses</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {createErrors.sub_account_type && <p className="text-red-500 text-sm">{createErrors.sub_account_type[0]}</p>}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="account_normal_side">Normal Side</Label>
                                    <Select
                                        value={createForm.account_normal_side}
                                        onValueChange={(value) =>
                                            setCreateForm({ ...createForm, account_normal_side: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="e.g. Debit" />
                                        </SelectTrigger>
                                        <SelectContent className='border-gray-300 border-[1.7px] rounded-sm'>
                                            <SelectItem value="debit">Debit</SelectItem>
                                            <SelectItem value="credit">Credit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {createErrors.account_normal_side && <p className="text-red-500 text-sm">{createErrors.account_normal_side[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_description">Description (Optional)</Label>
                                    <Input
                                        id="account_description"
                                        value={createForm.account_description}
                                        onChange={e => setCreateForm({ ...createForm, account_description: e.target.value })}
                                        placeholder="Brief description"
                                        className='border-gray-300 border-[1.7px] rounded-sm'
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? 'Saving...' : 'Save Account'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-sm border bg-card overflow-hidden py-0 pb-6">
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader className="border-0">
                            <TableRow className="bg-table-head hover:bg-table-head border-0">
                                <TableHead className="w-[8%] px-3 py-5 text-white text-base font-extrabold bg-table-head first:rounded-tl-sm">Code</TableHead>
                                <TableHead className="w-[15%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Name</TableHead>
                                <TableHead className="w-[12%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Group</TableHead>
                                <TableHead className="w-[10%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Type</TableHead>
                                <TableHead className="w-[12%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Sub-Type</TableHead>
                                <TableHead className="w-[20%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Description</TableHead>
                                <TableHead className="w-[8%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Side</TableHead>
                                <TableHead className="w-[8%] px-3 py-5 text-white text-base font-extrabold bg-table-head">Status</TableHead>
                                <TableHead className="w-[7%] px-3 py-5 text-white text-base font-extrabold bg-table-head text-right last:rounded-tr-sm">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 px-3">Loading accounts...</TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground px-3">No accounts found.</TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id} className="h-16">
                                        <TableCell className="font-medium px-3 text-sm">{account.account_code}</TableCell>
                                        <TableCell className="px-3">
                                            <Link href={route('accounts.view', account.id)} className="hover:underline font-medium">
                                                {account.account_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="px-3 text-xs">
                                            {(account as any).group?.name ? (
                                                <div className="text-blue-600 font-medium leading-tight">
                                                    <div>{(account as any).group.name}</div>
                                                    {(account as any).group.grp_code && (
                                                        <div className="text-[10px] text-muted-foreground">({(account as any).group.grp_code})</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-3 text-sm">{account.account_type}</TableCell>
                                        <TableCell className="px-3 text-xs text-muted-foreground truncate" title={account.sub_account_type || '-'}>
                                            {account.sub_account_type || '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-3 text-xs truncate" title={account.account_description || '-'}>
                                            {account.account_description || '-'}
                                        </TableCell>
                                        <TableCell className="px-3 text-sm capitalize">{account.account_normal_side}</TableCell>
                                        <TableCell className="px-3">
                                            <button
                                                onClick={() => handleToggleStatus(account.id)}
                                                className="hover:opacity-80 transition-opacity"
                                                title={`Click to make ${account.status === 'active' ? 'inactive' : 'active'}`}
                                            >
                                                <StatusIndicator status={account.status as 'active' | 'inactive'} />
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right px-3">
                                            {account.disbursement_items_count && account.disbursement_items_count > 0 ? (
                                                <div className="flex justify-end" title="Account is in use">
                                                    <Check className="size-4 text-green-600 opacity-50" />
                                                </div>
                                            ) : (
                                                canDelete && (
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => confirmDelete(account)}
                                                        title="Delete account"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} entries
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccounts(pagination.prev_page_url)}
                        disabled={!pagination.prev_page_url}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAccounts(pagination.next_page_url)}
                        disabled={!pagination.next_page_url}
                    >
                        Next
                    </Button>
                </div>
            </div>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{accountToDelete?.account_name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
