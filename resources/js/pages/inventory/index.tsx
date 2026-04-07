import { Head, Link, router, usePage } from '@inertiajs/react';
import { ClipboardCheck, Package, Pencil, Printer, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Inventory', href: route('inventory.index') },
];

interface UserRef {
    id: number;
    name: string;
    account_number: string;
}

interface InventoryRow {
    id: number;
    record_date: string;
    acquisition_date: string;
    amount: string;
    supplier_name: string;
    location: string;
    serial_prefix: string;
    serial_number: string;
    bulk: string | null;
    verification_status: string;
    verified_at: string | null;
    audit_remarks: string | null;
    created_at: string;
    creator?: UserRef | null;
    verifier?: UserRef | null;
}

interface PaginatedItems {
    data: InventoryRow[];
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
    items?: PaginatedItems;
    filterOptions?: {
        locations: string[];
        bulks: string[];
    };
    filters?: {
        location?: string;
        id?: string;
        bulk?: string;
        search?: string;
        sort?: string;
        direction?: string;
    };
}

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Date created' },
    { value: 'record_date', label: 'Record date' },
    { value: 'acquisition_date', label: 'Acquisition date' },
    { value: 'amount', label: 'Amount' },
    { value: 'location', label: 'Location' },
    { value: 'supplier_name', label: 'Supplier' },
    { value: 'id', label: 'ID' },
];

const emptyPaginated: PaginatedItems = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
    next_page_url: null,
    prev_page_url: null,
};

export default function InventoryIndex({
    items: itemsProp,
    filterOptions: filterOptionsProp,
    filters: filtersProp,
}: Props) {
    const { user } = usePage<SharedData>().props;
    const roles = (user?.roles as string[] | undefined) || [];
    const isAuditor = roles.includes('auditor');

    const filters = filtersProp ?? {};
    const filterOptions = filterOptionsProp ?? { locations: [], bulks: [] };
    const items = itemsProp ?? emptyPaginated;

    const initialSort =
        typeof filters.sort === 'string' && SORT_OPTIONS.some((o) => o.value === filters.sort)
            ? filters.sort
            : 'created_at';
    const initialDirection = filters.direction === 'asc' || filters.direction === 'desc' ? filters.direction : 'desc';

    const [search, setSearch] = useState(filters.search || '');
    const [locationFilter, setLocationFilter] = useState<string>(filters.location || 'all');
    const [bulkFilter, setBulkFilter] = useState<string>(filters.bulk || 'all');
    const [idFilter, setIdFilter] = useState<string>(filters.id != null ? String(filters.id) : '');
    const [sortColumn, setSortColumn] = useState<string>(initialSort);
    const [direction, setDirection] = useState<string>(initialDirection);

    const skipAutoFetch = useRef(true);

    const [verifyOpen, setVerifyOpen] = useState(false);
    const [verifyTarget, setVerifyTarget] = useState<InventoryRow | null>(null);
    const [auditRemarks, setAuditRemarks] = useState('');
    const [verifySubmitting, setVerifySubmitting] = useState(false);

    const [rowPrint, setRowPrint] = useState<InventoryRow | null>(null);

    const locations = Array.isArray(filterOptions.locations) ? filterOptions.locations : [];
    const bulks = Array.isArray(filterOptions.bulks) ? filterOptions.bulks : [];

    const buildParams = (overrides: Record<string, string> = {}) => {
        const params: Record<string, string> = {
            search,
            location: locationFilter,
            bulk: bulkFilter,
            id: idFilter,
            sort: sortColumn,
            direction,
            ...overrides,
        };
        Object.keys(params).forEach((key) => {
            const v = params[key];
            if (!v || v === 'all') {
                delete params[key];
            }
        });
        return params;
    };

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(route('inventory.index'), buildParams(overrides), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        const t = setTimeout(() => {
            if (skipAutoFetch.current) {
                return;
            }
            if (search !== (filters.search || '')) {
                applyFilters({ search });
            }
        }, 500);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (skipAutoFetch.current) {
                return;
            }
            const cur = filters.id != null ? String(filters.id) : '';
            if (idFilter !== cur) {
                applyFilters({ id: idFilter });
            }
        }, 400);
        return () => clearTimeout(t);
    }, [idFilter]);

    useEffect(() => {
        if (skipAutoFetch.current) {
            return;
        }
        if (
            locationFilter !== (filters.location || 'all') ||
            bulkFilter !== (filters.bulk || 'all') ||
            sortColumn !== (filters.sort || 'created_at') ||
            direction !== (filters.direction || 'desc')
        ) {
            applyFilters({
                location: locationFilter,
                bulk: bulkFilter,
                sort: sortColumn,
                direction,
            });
        }
    }, [locationFilter, bulkFilter, sortColumn, direction]);

    useEffect(() => {
        skipAutoFetch.current = false;
    }, []);

    const formatMoney = (amount: string) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const fullSerial = (row: InventoryRow) => `${row.serial_prefix}${row.serial_number}`.trim();

    const openVerify = (row: InventoryRow) => {
        setVerifyTarget(row);
        setAuditRemarks('');
        setVerifyOpen(true);
    };

    const submitVerify = () => {
        if (!verifyTarget) return;
        setVerifySubmitting(true);
        router.post(
            route('inventory.verify', { inventoryItem: verifyTarget.id }),
            { audit_remarks: auditRemarks || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Inventory record verified.');
                    setVerifyOpen(false);
                    setVerifyTarget(null);
                },
                onError: () => {
                    toast.error('Could not verify this record.');
                },
                onFinish: () => setVerifySubmitting(false),
            },
        );
    };

    const handlePrintList = () => {
        window.print();
    };

    const handlePrintRow = (row: InventoryRow) => {
        setRowPrint(row);
        setTimeout(() => {
            window.print();
            setTimeout(() => setRowPrint(null), 300);
        }, 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #inventory-list-print, #inventory-list-print *,
                        #inventory-row-print, #inventory-row-print * { visibility: visible; }
                        #inventory-list-print, #inventory-row-print {
                            position: absolute; left: 0; top: 0; width: 100%;
                        }
                    }
                `}</style>
            </Head>
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-header flex items-center gap-2">
                            <Package className="h-7 w-7" />
                            Inventory
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
                            Ma&apos;am Joy (Inventory Clerk) to be verified by the Auditor.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <Button variant="outline" className="gap-2" onClick={handlePrintList}>
                            <Printer className="h-4 w-4" />
                            Print list
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={route('inventory.reports.monthly')}>Monthly report</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={route('inventory.reports.year', { mode: 'rolling_12' })}>Year view</Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('inventory.create')}>Add record</Link>
                        </Button>
                    </div>
                </div>

                <Card className="print:hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filters</CardTitle>
                        <CardDescription>Filter by location, ID, bulk, or search supplier / serial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Supplier, serial, location…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Select value={locationFilter} onValueChange={setLocationFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All locations" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All locations</SelectItem>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc} value={loc}>
                                                {loc}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Bulk</Label>
                                <Select value={bulkFilter} onValueChange={setBulkFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All bulk groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All bulk groups</SelectItem>
                                        {bulks.map((b) => (
                                            <SelectItem key={b} value={b}>
                                                {b}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ID</Label>
                                <Input
                                    placeholder="Record ID"
                                    value={idFilter}
                                    onChange={(e) => setIdFilter(e.target.value.replace(/\D/g, ''))}
                                    inputMode="numeric"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                            <div className="space-y-2">
                                <Label>Sort by</Label>
                                <Select value={sortColumn} onValueChange={setSortColumn}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Direction</Label>
                                <Select value={direction} onValueChange={setDirection}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Newest / high first</SelectItem>
                                        <SelectItem value="asc">Oldest / low first</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 print:hidden">
                        <CardTitle className="text-base">Records</CardTitle>
                        <CardDescription>
                            {items.total} record(s) — showing {items.from || 0} to {items.to || 0}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div id="inventory-list-print" className="rounded-md border overflow-x-auto">
                            <div className="p-4 hidden print:block">
                                <h2 className="text-lg font-semibold">Inventory list</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {new Date().toLocaleString('en-US')}
                                </p>
                            </div>
                            {(!Array.isArray(items.data) || items.data.length === 0) ? (
                                <div className="py-12 text-center text-muted-foreground print:hidden">
                                    No inventory records found.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[72px]">ID</TableHead>
                                            <TableHead>Serial</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Bulk</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created by</TableHead>
                                            <TableHead>Verified by</TableHead>
                                            <TableHead className="w-[200px] print:hidden">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(Array.isArray(items.data) ? items.data : []).map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="font-mono text-sm">{row.id}</TableCell>
                                                <TableCell className="font-mono text-sm whitespace-nowrap">
                                                    {fullSerial(row)}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-[160px] truncate" title={row.supplier_name}>
                                                    {row.supplier_name}
                                                </TableCell>
                                                <TableCell className="text-sm">{row.location}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {row.bulk || '—'}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">{formatMoney(row.amount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={row.verification_status === 'verified' ? 'default' : 'secondary'}>
                                                        {row.verification_status === 'verified' ? 'Verified' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {row.creator ? `${row.creator.name}` : '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {row.verifier ? `${row.verifier.name}` : '—'}
                                                </TableCell>
                                                <TableCell className="print:hidden">
                                                    <div className="flex flex-wrap gap-1">
                                                        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                                                            <Link href={route('inventory.edit', { inventoryItem: row.id })}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2"
                                                            onClick={() => handlePrintRow(row)}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        {isAuditor && row.verification_status !== 'verified' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2"
                                                                onClick={() => openVerify(row)}
                                                            >
                                                                <ClipboardCheck className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {items.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4 print:hidden">
                                <p className="text-sm text-muted-foreground">
                                    Page {items.current_page} of {items.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!items.prev_page_url}
                                        onClick={() => {
                                            if (items.prev_page_url) {
                                                router.get(items.prev_page_url, {}, { preserveScroll: true, preserveState: true });
                                            }
                                        }}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!items.next_page_url}
                                        onClick={() => {
                                            if (items.next_page_url) {
                                                router.get(items.next_page_url, {}, { preserveScroll: true, preserveState: true });
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

            <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify inventory record</DialogTitle>
                        <DialogDescription>
                            Confirm verification for record #{verifyTarget?.id} ({verifyTarget ? fullSerial(verifyTarget) : ''}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <Label htmlFor="audit_remarks">Auditor remarks (optional)</Label>
                        <textarea
                            id="audit_remarks"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={auditRemarks}
                            onChange={(e) => setAuditRemarks(e.target.value)}
                            maxLength={2000}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setVerifyOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={submitVerify} disabled={verifySubmitting}>
                            {verifySubmitting ? 'Verifying…' : 'Mark verified'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {rowPrint && (
                <div id="inventory-row-print" className="fixed left-0 top-0 z-[-1] bg-white p-8 text-black" aria-hidden>
                    <h2 className="text-xl font-bold">Inventory record #{rowPrint.id}</h2>
                    <p className="text-sm mt-4">
                        <strong>Serial:</strong> {fullSerial(rowPrint)}
                    </p>
                    <p className="text-sm">
                        <strong>Supplier:</strong> {rowPrint.supplier_name}
                    </p>
                    <p className="text-sm">
                        <strong>Location:</strong> {rowPrint.location}
                    </p>
                    <p className="text-sm">
                        <strong>Bulk:</strong> {rowPrint.bulk || '—'}
                    </p>
                    <p className="text-sm">
                        <strong>Amount:</strong> {formatMoney(rowPrint.amount)}
                    </p>
                    <p className="text-sm">
                        <strong>Record date:</strong> {formatDate(rowPrint.record_date)}
                    </p>
                    <p className="text-sm">
                        <strong>Acquisition:</strong> {formatDate(rowPrint.acquisition_date)}
                    </p>
                    <p className="text-sm">
                        <strong>Status:</strong> {rowPrint.verification_status}
                    </p>
                </div>
            )}
        </AppLayout>
    );
}
