import { Head, Link, usePage, router } from '@inertiajs/react';
import { Search, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Account } from '@/types/database';

interface Journal {
    id: number;
    control_number: string;
    title: string;
    description?: string;
    status: string;
    created_at: string;
    items?: {
        id: number;
        type: 'debit' | 'credit';
        amount: number;
    }[];
}

interface PaginatedJournals {
    data: Journal[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    account: Account & { journal_items_count: number };
    journals: PaginatedJournals;
    filters: { search?: string };
}

export default function AccountView({ account, journals, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Chart of Accounts', href: route('accounts.index') },
        { title: account?.account_name || 'Account Details', href: '#' },
    ];

    const handleFilterChange = (newFilters: any) => {
        const params = {
            search,
            ...newFilters
        };

        // Remove empty filters
        Object.keys(params).forEach(key => {
            if (!params[key]) {
                delete params[key];
            }
        });

        router.get(route('accounts.show', { id: account.id }), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters.search || '')) {
                handleFilterChange({ search });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Account Details - ${account?.account_name || ''}`} />
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('accounts.index')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl text-header">{account?.account_name}</h2>
                        <p className="text-muted-foreground">
                            {account?.account_code} • {account?.account_type}
                            {account?.sub_account_type && ` • ${account.sub_account_type}`}
                        </p>
                    </div>
                </div>

                {/* Account Details Card */}
                <div className="rounded-sm border bg-card p-6">
                    <h3 className="text-xl font-semibold mb-4">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Account Code</p>
                            <p className="font-medium">{account?.account_code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Normal Side</p>
                            <p className="font-medium capitalize">{account?.account_normal_side}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Type</p>
                            <p className="font-medium">{account?.account_type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Sub-Type</p>
                            <p className="font-medium">{account?.sub_account_type || '-'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="font-medium">{account?.account_description || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Referenced in Journals</p>
                            <p className="font-medium">{account?.journal_items_count || 0} times</p>
                        </div>
                    </div>
                </div>

                {/* Journals Section */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-2xl font-semibold">Journal History</h3>

                    {/* Search */}
                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search journals..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 border-gray-300 border-[1.7px] rounded-sm"
                        />
                    </div>

                    {/* Table */}
                    <div className="rounded-sm border bg-card overflow-hidden">
                        <Table>
                            <TableHeader className="border-0">
                                <TableRow className="bg-table-head hover:bg-table-head border-0">
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Control Number</TableHead>
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Title</TableHead>
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Amount</TableHead>
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Entry Type</TableHead>
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Date</TableHead>
                                    <TableHead className="px-4 py-5 text-white text-base font-extrabold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journals.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No journals found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    journals.data.map((journal: any) => {
                                        const accountItem = journal.items?.[0];
                                        return (
                                            <TableRow key={journal.id} className="h-16">
                                                <TableCell className="font-medium px-4">
                                                    <Link
                                                        href={route('vouchers.show', { id: journal.id })}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {journal.control_number}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="px-4">{journal.title}</TableCell>
                                                <TableCell className="px-4">
                                                    {accountItem ? formatCurrency(accountItem.amount) : '-'}
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${accountItem?.type === 'debit'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {accountItem?.type || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 text-sm text-muted-foreground">
                                                    {formatDate(journal.created_at)}
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${journal.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : journal.status === 'rejected'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {journal.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {journals.from} to {journals.to} of {journals.total} entries
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={!journals.prev_page_url}
                            >
                                <Link
                                    href={journals.prev_page_url || '#'}
                                    preserveState
                                    preserveScroll
                                >
                                    Previous
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                disabled={!journals.next_page_url}
                            >
                                <Link
                                    href={journals.next_page_url || '#'}
                                    preserveState
                                    preserveScroll
                                >
                                    Next
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
