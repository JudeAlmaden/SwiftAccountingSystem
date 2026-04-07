import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface SummaryRow {
    location: string;
    count: number;
    total_amount: string;
}

interface UserRef {
    id: number;
    name: string;
    account_number: string;
}

interface RecordRow {
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
    creator?: UserRef | null;
    verifier?: UserRef | null;
}

interface PaginatedRecords {
    data: RecordRow[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    mode: string;
    year: number;
    periodLabel: string;
    dateFrom: string;
    dateTo: string;
    summaryByLocation: SummaryRow[];
    grandTotal: string;
    grandCount: number;
    records: PaginatedRecords;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Inventory', href: route('inventory.index') },
    { title: 'Year view', href: route('inventory.reports.year') },
];

export default function InventoryYearReport({
    mode: initialMode,
    year: initialYear,
    periodLabel,
    summaryByLocation,
    grandTotal,
    grandCount,
    records,
}: Props) {
    const [mode, setMode] = useState(initialMode);
    const [year, setYear] = useState(String(initialYear));

    const apply = () => {
        const q: Record<string, string> = { mode };
        if (mode === 'calendar_year') {
            q.year = year;
        }
        router.get(route('inventory.reports.year'), q, { preserveState: true, preserveScroll: true, replace: true });
    };

    const formatMoney = (amount: string) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));

    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    const handlePrint = () => window.print();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory — year view">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #inventory-year-print, #inventory-year-print * { visibility: visible; }
                        #inventory-year-print { position: absolute; left: 0; top: 0; width: 100%; }
                    }
                `}</style>
            </Head>
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('inventory.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-header">Inventory — year view</h1>
                            <p className="text-muted-foreground text-sm mt-1">{periodLabel}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-2">
                            <Label>Scope</Label>
                            <Select value={mode} onValueChange={setMode}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rolling_12">Last 12 months</SelectItem>
                                    <SelectItem value="calendar_year">Calendar year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {mode === 'calendar_year' && (
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button type="button" onClick={apply}>
                            Apply
                        </Button>
                        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div id="inventory-year-print" className="space-y-6">
                    <div className="hidden print:block pb-4">
                        <h2 className="text-xl font-bold">Inventory — year view</h2>
                        <p className="text-sm">{periodLabel}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Total records: {grandCount} — Grand total: {formatMoney(grandTotal)}
                        </p>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Summary</CardTitle>
                            <CardDescription>
                                {grandCount} record(s) in range — grand total {formatMoney(grandTotal)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryByLocation.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No records in this range.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Count</TableHead>
                                            <TableHead className="text-right">Total amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaryByLocation.map((row) => (
                                            <TableRow key={row.location}>
                                                <TableCell>{row.location}</TableCell>
                                                <TableCell className="text-right">{row.count}</TableCell>
                                                <TableCell className="text-right font-medium">{formatMoney(row.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Records</CardTitle>
                            <CardDescription>
                                {records.total} row(s) — page {records.current_page} of {records.last_page || 1}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {records.data.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No records.</p>
                            ) : (
                                <>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Record date</TableHead>
                                                    <TableHead>Serial</TableHead>
                                                    <TableHead>Supplier</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {records.data.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-mono text-sm">{row.id}</TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap">{row.record_date}</TableCell>
                                                        <TableCell className="font-mono text-sm whitespace-nowrap">
                                                            {row.serial_prefix}
                                                            {row.serial_number}
                                                        </TableCell>
                                                        <TableCell className="text-sm max-w-[140px] truncate">{row.supplier_name}</TableCell>
                                                        <TableCell className="text-sm">{row.location}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatMoney(row.amount)}</TableCell>
                                                        <TableCell className="text-sm">{row.verification_status}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {records.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4 print:hidden">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {records.from}–{records.to} of {records.total}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!records.prev_page_url}
                                                    onClick={() => {
                                                        if (records.prev_page_url) {
                                                            router.get(records.prev_page_url, {}, { preserveScroll: true });
                                                        }
                                                    }}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!records.next_page_url}
                                                    onClick={() => {
                                                        if (records.next_page_url) {
                                                            router.get(records.next_page_url, {}, { preserveScroll: true });
                                                        }
                                                    }}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
