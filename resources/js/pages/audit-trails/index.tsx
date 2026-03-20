import { Head, router } from '@inertiajs/react';
import { Search, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Audit Trails', href: route('audit-trails.index') },
];

interface AuditTrailUser {
    id: number;
    name: string;
    account_number: string;
}

interface AuditTrailRecord {
    id: number;
    user_id: number | null;
    event_type: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    user?: AuditTrailUser | null;
}

interface PaginatedAuditTrails {
    data: AuditTrailRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    trails: PaginatedAuditTrails;
    filtersOptions: {
        event_types: string[];
        users: AuditTrailUser[];
    };
    filters: {
        search?: string;
        event_type?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function AuditTrailsIndex({ trails, filtersOptions, filters }: Props) {
    const { event_types: eventTypes, users } = filtersOptions;


    const [search, setSearch] = useState(filters.search || '');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>(filters.event_type || 'all');
    const [userIdFilter, setUserIdFilter] = useState<string>(filters.user_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilterChange = (newFilters: any) => {
        const params: Record<string, string> = {
            search,
            event_type: eventTypeFilter,
            user_id: userIdFilter,
            date_from: dateFrom,
            date_to: dateTo,
            ...newFilters
        };

        // Clean up empty params & 'all' defaults
        Object.keys(params).forEach(key => {
            if (!params[key] || params[key] === 'all') {
                delete params[key];
            }
        });

        router.get(route('audit-trails.index'), params, {
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

    // Handle other filters immediately
    useEffect(() => {
        if (
            eventTypeFilter !== (filters.event_type || 'all') ||
            userIdFilter !== (filters.user_id || 'all') ||
            dateFrom !== (filters.date_from || '') ||
            dateTo !== (filters.date_to || '')
        ) {
            handleFilterChange({
                event_type: eventTypeFilter,
                user_id: userIdFilter,
                date_from: dateFrom,
                date_to: dateTo
            });
        }
    }, [eventTypeFilter, userIdFilter, dateFrom, dateTo]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatEventType = (type: string) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Trails" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-header flex items-center gap-2">
                        <ClipboardList className="h-7 w-7" />
                        Audit Trails
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track important events such as password changes, disbursement approvals, and user changes.
                    </p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filters</CardTitle>
                        <CardDescription>Search and filter audit events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Description or event type..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Event type</Label>
                                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        {eventTypes.map(t => (
                                            <SelectItem key={t} value={t}>{formatEventType(t)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Performed by</Label>
                                <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All users</SelectItem>
                                        {users.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.account_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>From date</Label>
                                <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From" />
                            </div>
                            <div className="space-y-2">
                                <Label>To date</Label>
                                <DatePicker value={dateTo} onChange={setDateTo} placeholder="To" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Events</CardTitle>
                        <CardDescription>
                            {trails.total} event(s) — showing {trails.from || 0} to {trails.to || 0}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trails.data.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No audit events found.</div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[160px]">Date & time</TableHead>
                                            <TableHead className="w-[140px]">Event type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-[180px]">Performed by</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trails.data.map(row => (
                                            <TableRow key={row.id}>
                                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                    {formatDate(row.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-muted/50">
                                                        {formatEventType(row.event_type)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm">{row.description}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {row.user ? `${row.user.name} (#${row.user.account_number})` : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                        {trails.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {trails.current_page} of {trails.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!trails.prev_page_url}
                                        onClick={() => {
                                            if (trails.prev_page_url) {
                                                router.get(trails.prev_page_url, {}, { preserveScroll: true, preserveState: true });
                                            }
                                        }}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!trails.next_page_url}
                                        onClick={() => {
                                            if (trails.next_page_url) {
                                                router.get(trails.next_page_url, {}, { preserveScroll: true, preserveState: true });
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
