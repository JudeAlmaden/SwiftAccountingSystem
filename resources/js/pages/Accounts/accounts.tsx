import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from 'react';
import type { Account } from '@/types/database';
import { route } from 'ziggy-js';
import { StatusIndicator } from '@/components/status-indicator';
import { Trash2, Check, Search } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-line';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Chart of Accounts',
        href: route('accounts'),
    },
];

export default function ChartOfAccounts() {
    // Get the CSRF token manually if needed, or rely on Laravel's default handling if axios was used.
    // Since we are using fetch, we need to pass the CSRF token.
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';
    const { user } = usePage<SharedData>().props;
    const permissions = user.permissions || [];

    const canCreate = permissions.includes('create accounts');
    const canDelete = permissions.includes('delete accounts');

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
        account_description: '',
        account_normal_side: '',
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createErrors, setCreateErrors] = useState<any>({});

    // Delete Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                console.log(data);
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
                    account_description: '',
                    account_normal_side: '',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts" />
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl text-header">Chart of Accounts</h2>
                        <p className="text-muted-foreground">Manage your financial accounts and structure.</p>
                    </div>
                </div>

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
                            <DialogContent>

                                <DialogHeader className='gap-1'>
                                    <DialogTitle className='text-2xl text-table-head pt-1'>Create New Account</DialogTitle>
                                    <DialogDescription className='text-sm'>
                                        Add a new account to your chart of account
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
                                                setCreateForm({ ...createForm, account_type: value })
                                            }
                                        >
                                            <SelectTrigger className='border-gray-300 border-[1.7px] rounded-sm'>
                                                <SelectValue placeholder="e.g. Assets" />
                                            </SelectTrigger>
                                            <SelectContent className='border-gray-300 border-[1.7px] rounded-sm'>
                                                <SelectItem value="Assets">Assets</SelectItem>
                                                <SelectItem value="Liabilities">Liabilities</SelectItem>
                                                <SelectItem value="Equity">Equity</SelectItem>
                                                <SelectItem value="Revenue">Revenue</SelectItem>
                                                <SelectItem value="Expenses">Expenses</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {createErrors.account_type && <p className="text-red-500 text-sm">{createErrors.account_type[0]}</p>}
                                    </div>
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
                    <Table>
                        <TableHeader className="border-0">
                            <TableRow className="bg-table-head hover:bg-table-head border-0">
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head first:rounded-tl-sm">Code</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Name</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Type</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Description</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Normal Side</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Status</TableHead>
                                <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head text-right last:rounded-tr-sm">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 px-4">Loading accounts...</TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground px-4">No accounts found.</TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id} className="h-16">
                                        <TableCell className="font-medium px-4">{account.account_code}</TableCell>
                                        <TableCell className="px-4">{account.account_name}</TableCell>
                                        <TableCell className="px-4">{account.account_type}</TableCell>
                                        <TableCell className="text-muted-foreground px-4">{account.account_description || '-'}</TableCell>
                                        <TableCell className="px-4">{account.account_normal_side}</TableCell>
                                        <TableCell className="px-4">
                                            <button
                                                onClick={() => handleToggleStatus(account.id)}
                                                className="hover:opacity-80 transition-opacity"
                                                title={`Click to make ${account.status === 'active' ? 'inactive' : 'active'}`}
                                            >
                                                <StatusIndicator status={account.status as 'active' | 'inactive'} />
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            {account.disbursement_items_count && account.disbursement_items_count > 0 ? (
                                                <div className="flex justify-end" title="Account is in use">
                                                    <Check className="size-5 text-green-600 opacity-50" />
                                                </div>
                                            ) : (
                                                canDelete && (
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => confirmDelete(account)}
                                                        title="Delete account"
                                                    >
                                                        <Trash2 className="size-4" />
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

                {/* Pagination Controls */}
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

                {/* Delete Confirmation Dialog */}
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
        </AppLayout>
    );
}
