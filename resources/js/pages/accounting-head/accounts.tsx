import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import type { Account } from '@/types/database';
import { route } from 'ziggy-js';

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
                });
                fetchAccounts(); // Refresh current list
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
            .then(res => {
                if (res.ok) {
                    setIsDeleteOpen(false);
                    setAccountToDelete(null);
                    fetchAccounts(); // Refresh
                } else {
                    alert('Failed to delete account');
                }
            })
            .catch(err => console.error(err))
            .finally(() => setIsDeleting(false));
    };

    const confirmDelete = (account: Account) => {
        setAccountToDelete(account);
        setIsDeleteOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts" />
            <div className="flex flex-col gap-6 p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Chart of Accounts</h2>
                        <p className="text-muted-foreground">Manage your financial accounts and structure.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Input
                        placeholder="Search accounts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Add Account</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Account</DialogTitle>
                                <DialogDescription>
                                    Add a new account to your chart of accounts. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="account_name">Account Name</Label>
                                    <Input
                                        id="account_name"
                                        value={createForm.account_name}
                                        onChange={e => setCreateForm({ ...createForm, account_name: e.target.value })}
                                        placeholder="e.g. Cash on Hand"
                                        required
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
                                    />
                                    {createErrors.account_code && <p className="text-red-500 text-sm">{createErrors.account_code[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_type">Account Type</Label>
                                    <Input
                                        id="account_type"
                                        value={createForm.account_type}
                                        onChange={e => setCreateForm({ ...createForm, account_type: e.target.value })}
                                        placeholder="e.g. Asset"
                                        required
                                    />
                                    {createErrors.account_type && <p className="text-red-500 text-sm">{createErrors.account_type[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_description">Description (Optional)</Label>
                                    <Input
                                        id="account_description"
                                        value={createForm.account_description}
                                        onChange={e => setCreateForm({ ...createForm, account_description: e.target.value })}
                                        placeholder="Brief description"
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
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Loading accounts...</TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No accounts found.</TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">{account.account_code}</TableCell>
                                        <TableCell>{account.account_name}</TableCell>
                                        <TableCell>{account.account_type}</TableCell>
                                        <TableCell className="text-muted-foreground">{account.account_description || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">{account.status}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => confirmDelete(account)}
                                            >
                                                Delete
                                            </Button>
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
