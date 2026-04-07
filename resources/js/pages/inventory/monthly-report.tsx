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

interface BulkSummaryRow {
    bulk: string;
    count: number;
    total_amount: string;
}

interface UserRef {
    id: number;
    name: string;
    account_number: string;
}

interface DetailRow {
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

interface PaginatedDetails {
    data: DetailRow[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    year: number;
    month: number;
    periodLabel: string;
    summaryByLocation: SummaryRow[];
    summaryByBulk: BulkSummaryRow[];
    details: PaginatedDetails;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Inventory', href: route('inventory.index') },
    { title: 'Monthly report', href: route('inventory.reports.monthly') },
];

const MONTHS = [
    { v: 1, l: 'January' },
    { v: 2, l: 'February' },
    { v: 3, l: 'March' },
    { v: 4, l: 'April' },
    { v: 5, l: 'May' },
    { v: 6, l: 'June' },
    { v: 7, l: 'July' },
    { v: 8, l: 'August' },
    { v: 9, l: 'September' },
    { v: 10, l: 'October' },
    { v: 11, l: 'November' },
    { v: 12, l: 'December' },
];

export default function InventoryMonthlyReport({
    year: initialYear,
    month: initialMonth,
    periodLabel,
    summaryByLocation,
    summaryByBulk,
    details,
}: Props) {
    const [year, setYear] = useState(String(initialYear));
    const [month, setMonth] = useState(String(initialMonth));

    const applyPeriod = () => {
        router.get(
            route('inventory.reports.monthly'),
            { year, month },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const formatMoney = (amount: string) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));

    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    const handlePrint = () => window.print();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Inventory — ${periodLabel}`}>
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #inventory-monthly-print, #inventory-monthly-print * { visibility: visible; }
                        #inventory-monthly-print { position: absolute; left: 0; top: 0; width: 100%; }
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
                            <h1 className="text-2xl font-bold tracking-tight text-header">Monthly inventory report</h1>
                            <p className="text-muted-foreground text-sm mt-1">{periodLabel}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
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
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m) => (
                                        <SelectItem key={m.v} value={String(m.v)}>
                                            {m.l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="button" onClick={applyPeriod}>
                            Apply
                        </Button>
                        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>

                <div id="inventory-monthly-print" className="space-y-6">
                    <div className="hidden print:block pb-4">
                        <h2 className="text-xl font-bold">Inventory — monthly report</h2>
                        <p className="text-sm">{periodLabel}</p>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Tally by location</CardTitle>
                            <CardDescription>Counts and amounts for the selected month (by record date).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryByLocation.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No records in this period.</p>
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
                            <CardTitle className="text-base">Tally by bulk</CardTitle>
                            <CardDescription>Non-empty bulk values only.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryByBulk.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No bulk groupings in this period.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bulk</TableHead>
                                            <TableHead className="text-right">Count</TableHead>
                                            <TableHead className="text-right">Total amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaryByBulk.map((row) => (
                                            <TableRow key={row.bulk}>
                                                <TableCell>{row.bulk}</TableCell>
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
                            <CardTitle className="text-base">Record detail</CardTitle>
                            <CardDescription>
                                {details.total} record(s) — page {details.current_page} of {details.last_page || 1}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {details.data.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No line items.</p>
                            ) : (
                                <>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Serial</TableHead>
                                                    <TableHead>Supplier</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {details.data.map((row) => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-mono text-sm">{row.id}</TableCell>
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
                                    {details.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4 print:hidden">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {details.from}–{details.to} of {details.total}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!details.prev_page_url}
                                                    onClick={() => {
                                                        if (details.prev_page_url) {
                                                            router.get(details.prev_page_url, {}, { preserveScroll: true });
                                                        }
                                                    }}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!details.next_page_url}
                                                    onClick={() => {
                                                        if (details.next_page_url) {
                                                            router.get(details.next_page_url, {}, { preserveScroll: true });
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
