import { Head, Link, router, usePage } from '@inertiajs/react';
import { Calendar, Search, Filter, ArrowUpDown, Inbox, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import type { SharedData } from '@/types';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Vouchers',
        href: route('vouchers.index'),
    },
];

interface Journal {
    id: number;
    control_number: string;
    title: string;
    description: string;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
    total_amount?: number;
}

export default function Journals() {
    const { journals, filters, auth, user: propsUser, pending_count } = usePage<any>().props;
    const user = auth?.user || propsUser || {};
    const pendingCount = pending_count || user?.pending_vouchers_count || 0;
    const permissions = user?.permissions || [];
    const canCreate = permissions.includes('create journals');
    const canView = permissions.includes('view journals');

    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [handlingFilter, setHandlingFilter] = useState(filters.handling || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'desc');

    const handleFilterChange = (newFilters: any) => {
        const params = {
            search,
            status: statusFilter,
            type: typeFilter,
            handling: handlingFilter,
            date_from: dateFrom,
            date_to: dateTo,
            sort_by: sortBy,
            sort_order: sortOrder,
            ...newFilters
        };

        // Remove empty or 'all' filters
        Object.keys(params).forEach(key => {
            if (!params[key] || params[key] === 'all') {
                delete params[key];
            }
        });

        router.get(route('vouchers.index'), params, {
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

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('all');
        setTypeFilter('all');
        setHandlingFilter('all');
        setSortBy('created_at');
        setSortOrder('desc');
        router.get(route('vouchers.index'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vouchers" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl text-header">Vouchers</h2>
                        <p className="text-muted-foreground">Manage and track all journal and disbursement vouchers.</p>
                    </div>
                    {canCreate && (
                        <div className="flex gap-2">
                            <Button asChild>
                                <Link href={route('vouchers.create')}>
                                    Create Voucher
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search vouchers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-lg pl-9 bg-white border-gray-300 border-[1.6px]"
                        />
                    </div>

                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v);
                            handleFilterChange({ status: v });
                        }}
                    >
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={typeFilter}
                        onValueChange={(v) => {
                            setTypeFilter(v);
                            handleFilterChange({ type: v });
                        }}
                    >
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="disbursement">Disbursement</SelectItem>
                            <SelectItem value="journal">Journal</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={handlingFilter}
                        onValueChange={(v) => {
                            setHandlingFilter(v);
                            handleFilterChange({ handling: v });
                        }}
                    >
                        <SelectTrigger className="w-[150px] h-9 relative group">
                            <SelectValue placeholder="Handling" />
                            {handlingFilter === 'all' && pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                                    {pendingCount}
                                </span>
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vouchers</SelectItem>
                            <SelectItem value="me">
                                <div className="flex items-center gap-2">
                                    <span>To Handle (Me)</span>
                                    {pendingCount > 0 && (
                                        <span className="flex h-4 w-auto min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                                            {pendingCount}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                            <SelectItem value="others">Waiting for Others</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-4">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Range</Label>
                                    <div className="flex flex-col gap-2">
                                        <DatePicker
                                            value={dateFrom}
                                            onChange={(v) => {
                                                setDateFrom(v);
                                                handleFilterChange({ date_from: v });
                                            }}
                                            placeholder="From date"
                                        />
                                        <DatePicker
                                            value={dateTo}
                                            onChange={(v) => {
                                                setDateTo(v);
                                                handleFilterChange({ date_to: v });
                                            }}
                                            placeholder="To date"
                                        />
                                    </div>
                                </div>

                                <DropdownMenuSeparator />

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sorting</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={sortBy}
                                            onValueChange={(v) => {
                                                setSortBy(v);
                                                handleFilterChange({ sort_by: v });
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs flex-1">
                                                <SelectValue placeholder="Sort by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="created_at">Date Created</SelectItem>
                                                <SelectItem value="control_number">Control #</SelectItem>
                                                <SelectItem value="title">Title</SelectItem>
                                                <SelectItem value="status">Status</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                                                setSortOrder(newOrder);
                                                handleFilterChange({ sort_order: newOrder });
                                            }}
                                            className="h-8 px-2 gap-1 text-[10px]"
                                        >
                                            <ArrowUpDown className="h-3 w-3" />
                                            {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                                        </Button>
                                    </div>
                                </div>

                                <DropdownMenuSeparator />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-8 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="rounded-sm border bg-card overflow-hidden py-0 pb-6">
                    <Table className="table-fixed w-full">
                        <TableHeader className="border-0">
                            <TableRow className="bg-table-head hover:bg-table-head border-0">
                                <TableHead className="w-[14%] px-4 py-5 text-white text-base font-extrabold bg-table-head first:rounded-tl-sm">Control Number</TableHead>
                                <TableHead className="w-[18%] px-4 py-5 text-white text-base font-extrabold bg-table-head">Title</TableHead>
                                <TableHead className="w-[10%] pl-2 pr-6 py-5 text-white text-base font-extrabold bg-table-head">Voucher Type</TableHead>
                                <TableHead className="w-[22%] px-4 py-5 pl-6 text-white text-base font-extrabold bg-table-head">Description</TableHead>
                                <TableHead className="w-[10%] px-4 py-5 text-white text-base font-extrabold bg-table-head">Status</TableHead>
                                <TableHead className="w-[14%] px-4 py-5 text-white text-base font-extrabold bg-table-head">Date Created</TableHead>
                                <TableHead className="w-[10%] px-4 py-5 text-white text-base font-extrabold bg-table-head text-right last:rounded-tr-sm">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {journals.data.length === 0 ? (
                                <TableRow className="h-16">
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground px-4">
                                        No vouchers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                journals.data.map((journal: any) => (
                                    <TableRow
                                        key={journal.id}
                                        className="h-16 cursor-pointer hover:bg-muted/40 transition-colors"
                                        onClick={(event) => {
                                            if (!canView) return;
                                            const target = event.target as HTMLElement;
                                            if (target.closest('a,button,input,select,textarea')) return;
                                            router.visit(route('vouchers.show', journal.id));
                                        }}
                                    >
                                        <TableCell className="font-medium px-4 truncate text-sm" title={journal.control_number}>
                                            {journal.control_number}
                                        </TableCell>
                                        <TableCell className="px-4 truncate text-sm" title={journal.title}>
                                            {journal.title}
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <span
                                                className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${journal.type === 'journal'
                                                    ? 'bg-teal-100 text-teal-700 border-teal-200'
                                                    : 'bg-orange-100 text-orange-700 border-orange-200'
                                                    }`}
                                            >
                                                {journal.type === 'journal' ? 'Journal' : 'Disbursement'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-4 truncate text-xs" title={journal.description}>
                                            {journal.description}
                                        </TableCell>
                                        <TableCell className="px-4">
                                            <span
                                                className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${journal.status.toLowerCase() === 'approved'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : journal.status.toLowerCase() === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : 'bg-red-100 text-red-700 border-red-200'
                                                    }`}
                                            >
                                                {journal.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 text-xs">{formatDate(journal.created_at)}</TableCell>
                                        <TableCell className="text-right px-4">
                                            <div className="flex justify-end gap-2 text-center">
                                                {canView && (
                                                    <Link href={route('vouchers.show', journal.id)} className="text-xs">
                                                        View
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {journals.from || 0} to {journals.to || 0} of {journals.total} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Page {journals.current_page} of {journals.last_page}
                        </span>
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
        </AppLayout >
    );
}
