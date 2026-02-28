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
        href: route('vouchers'),
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
    const { user } = usePage<SharedData>().props;
    const permissions = user.permissions || [];
    const canCreate = permissions.includes('create journals');
    const canView = permissions.includes('view journals');

    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const [journals, setJournals] = useState<Journal[]>([]);
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




    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');


    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchJournals = (url?: string | null) => {
        setIsLoading(true);

        const targetUrl = new URL(url || route('journals.index'));

        if (searchQuery) {
            targetUrl.searchParams.set('search', searchQuery);
        }
        if (dateFrom) {
            targetUrl.searchParams.set('date_from', dateFrom);
        }
        if (dateTo) {
            targetUrl.searchParams.set('date_to', dateTo);
        }
        if (statusFilter && statusFilter !== 'all') {
            targetUrl.searchParams.set('status', statusFilter);
        }
        if (typeFilter && typeFilter !== 'all') {
            targetUrl.searchParams.set('type', typeFilter);
        }
        if (sortBy) {
            targetUrl.searchParams.set('sort_by', sortBy);
        }
        if (sortOrder) {
            targetUrl.searchParams.set('sort_order', sortOrder);
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
                setJournals(data.data || []);
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
                console.error('Failed to fetch journals', err);
                setJournals([]);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(search);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        fetchJournals();
    }, [searchQuery, dateFrom, dateTo, statusFilter, typeFilter, sortBy, sortOrder]);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setStatusFilter('all');
        setTypeFilter('all');
        setSortBy('created_at');
        setSortOrder('desc');
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
                                <Link href={route('vouchers.generate')}>
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="disbursement">Disbursement</SelectItem>
                            <SelectItem value="journal">Journal</SelectItem>
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
                                            onChange={setDateFrom}
                                            placeholder="From date"
                                        />
                                        <DatePicker
                                            value={dateTo}
                                            onChange={setDateTo}
                                            placeholder="To date"
                                        />
                                    </div>
                                </div>

                                <DropdownMenuSeparator />

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sorting</Label>
                                    <div className="flex gap-2">
                                        <Select value={sortBy} onValueChange={setSortBy}>
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
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
                            {isLoading ? (
                                <TableRow className="h-16">
                                    <TableCell colSpan={7} className="text-center h-24 px-4">Loading vouchers...</TableCell>
                                </TableRow>
                            ) : journals.length === 0 ? (
                                <TableRow className="h-16">
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground px-4">
                                        No vouchers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                journals.map((journal) => (
                                    <TableRow
                                        key={journal.id}
                                        className="h-16 cursor-pointer hover:bg-muted/40 transition-colors"
                                        onClick={(event) => {
                                            if (!canView) return;
                                            const target = event.target as HTMLElement;
                                            if (target.closest('a,button,input,select,textarea')) return;
                                            router.visit(route('vouchers.view', journal.id));
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
                                                className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                    journal.type === 'journal'
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
                                                    <Link href={route('vouchers.view', journal.id)} className="text-xs">
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
                        Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchJournals(pagination.prev_page_url)}
                                disabled={!pagination.prev_page_url || isLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchJournals(pagination.next_page_url)}
                                disabled={!pagination.next_page_url || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout >
    );
}
