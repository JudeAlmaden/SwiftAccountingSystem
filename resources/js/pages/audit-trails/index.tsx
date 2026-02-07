import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Search, ClipboardList } from 'lucide-react';

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

export default function AuditTrailsIndex() {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const [records, setRecords] = useState<AuditTrailRecord[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        next_page_url: null as string | null,
        prev_page_url: null as string | null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [eventTypes, setEventTypes] = useState<string[]>([]);
    const [users, setUsers] = useState<AuditTrailUser[]>([]);

    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
    const [userIdFilter, setUserIdFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchFilters = () => {
        fetch(route('audit-trails.filters'), {
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token },
        })
            .then(res => res.json())
            .then(data => {
                setEventTypes(data.event_types || []);
                setUsers(data.users || []);
            })
            .catch(() => {});
    };

    const fetchData = (url?: string | null) => {
        setIsLoading(true);
        const targetUrl = new URL(url || route('audit-trails.data'));
        if (searchQuery) targetUrl.searchParams.set('search', searchQuery);
        if (eventTypeFilter && eventTypeFilter !== 'all') targetUrl.searchParams.set('event_type', eventTypeFilter);
        if (userIdFilter && userIdFilter !== 'all') targetUrl.searchParams.set('user_id', userIdFilter);
        if (dateFrom) targetUrl.searchParams.set('date_from', dateFrom);
        if (dateTo) targetUrl.searchParams.set('date_to', dateTo);

        fetch(targetUrl.toString(), {
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token },
        })
            .then(res => res.json())
            .then(data => {
                setRecords(data.data || []);
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                    from: data.from,
                    to: data.to,
                    next_page_url: data.next_page_url,
                    prev_page_url: data.prev_page_url,
                });
            })
            .catch(() => setRecords([]))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchFilters(); }, []);
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(search), 400);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => {
        fetchData();
    }, [searchQuery, eventTypeFilter, userIdFilter, dateFrom, dateTo]);

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
                            {pagination.total} event(s) — showing {pagination.from || 0} to {pagination.to || 0}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-12 text-center text-muted-foreground">Loading...</div>
                        ) : records.length === 0 ? (
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
                                        {records.map(row => (
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
                        {pagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.prev_page_url || isLoading}
                                        onClick={() => fetchData(pagination.prev_page_url)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.next_page_url || isLoading}
                                        onClick={() => fetchData(pagination.next_page_url)}
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
