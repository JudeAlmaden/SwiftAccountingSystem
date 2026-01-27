import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Calendar, Search, Filter, ArrowUpDown, Inbox, MoreHorizontal } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Disbursements',
        href: route('disbursements'),
    },
];

interface Disbursement {
    id: number;
    control_number: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    total_amount?: number;
}

interface Statistics {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

export default function Disbursements() {
    // Get CSRF token
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    // State for disbursements (paginated data)
    const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
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

    // Statistics state
    const [statistics, setStatistics] = useState<Statistics>({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    // Search State
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter States
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchDisbursements = (url?: string | null) => {
        setIsLoading(true);
        // Construct URL with all filter params
        const targetUrl = new URL(url || route('disbursements.index'));

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
                setDisbursements(data.data || []);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    next_page_url: data.next_page_url,
                    prev_page_url: data.prev_page_url,
                    total: data.total,
                    from: data.from,
                    to: data.to,
                });

                // Update statistics if provided
                if (data.statistics) {
                    setStatistics(data.statistics);
                }

                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch disbursements', err);
                setDisbursements([]);
                setIsLoading(false);
            });
    };

    // Debounce search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(search);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Fetch when filters change
    useEffect(() => {
        fetchDisbursements();
    }, [searchQuery, dateFrom, dateTo, statusFilter, sortBy, sortOrder]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
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
        setSortBy('created_at');
        setSortOrder('desc');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disbursements" />

            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl text-header">Disbursements</h2>
                        <p className="text-muted-foreground">Manage and track all disbursement requests.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Inbox className="mr-2 h-4 w-4" />
                            Inbox
                        </Button>
                        <Button>
                            Generate Disbursement
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disbursements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
                        </CardContent>
                    </Card>
                </div>


                {/* Filters Section - Ultra Compact */}
                <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search disbursements..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>

                    {/* Status Select - Kept outside as it's common */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* More Filters - The "three dotted thingy" */}
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
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="pl-8 h-8 text-xs w-full"
                                                placeholder="From"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="pl-8 h-8 text-xs w-full"
                                                placeholder="To"
                                            />
                                        </div>
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

                {/* Disbursements Table */}
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Control Number</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Loading disbursements...</TableCell>
                                </TableRow>
                            ) : disbursements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No disbursements found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                disbursements.map((disbursement) => (
                                    <TableRow key={disbursement.id}>
                                        <TableCell className="font-medium">{disbursement.control_number}</TableCell>
                                        <TableCell>{disbursement.title}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {disbursement.description}
                                        </TableCell>
                                        <TableCell>
                                            {disbursement.total_amount
                                                ? formatCurrency(disbursement.total_amount)
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(disbursement.status)}>
                                                {disbursement.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(disbursement.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm">
                                                    View
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            </div>
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
                                onClick={() => fetchDisbursements(pagination.prev_page_url)}
                                disabled={!pagination.prev_page_url || isLoading}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchDisbursements(pagination.next_page_url)}
                                disabled={!pagination.next_page_url || isLoading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
