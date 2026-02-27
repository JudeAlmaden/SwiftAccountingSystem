import { Head } from '@inertiajs/react';
import { BookOpen, PieChart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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
    { title: 'Account Reports', href: route('reports.accounts') },
];

type Period = 'daily' | 'monthly' | 'yearly';

interface ReportData {
    period: Period;
    date_from: string | null;
    date_to: string | null;
    summary: {
        total: number;
        active: number;
        inactive: number;
        by_type: Record<string, number>;
    };
    accounts_with_usage: Array<{
        id: number;
        account_name: string;
        account_code: string;
        account_type: string;
        status: string;
        usage_count: number;
        total_debit?: number;
        total_credit?: number;
    }>;
}

function defaultDateFrom(): string {
    const d = new Date();
    d.setDate(1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function defaultDateTo(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function AccountReportPage() {
    const [period, setPeriod] = useState<Period>('monthly');
    const [dateFrom, setDateFrom] = useState<string | null>(() => defaultDateFrom());
    const [dateTo, setDateTo] = useState<string | null>(() => defaultDateTo());
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('period', period);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        fetch(`/api/reports/accounts?${params}`, {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load report');
                return res.json();
            })
            .then(setData)
            .catch(() => setError('Failed to load account report.'))
            .finally(() => setLoading(false));
    }, [period, dateFrom, dateTo]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading && !data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Account Reports" />
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    Loading report…
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account Reports" />
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Account Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Chart of accounts summary and usage in disbursements (optional time range)
                    </p>
                </div>

                {/* Time range */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Time range</CardTitle>
                        <CardDescription>
                            Optionally filter usage and amounts by date range
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Period</Label>
                            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">From</Label>
                            <DatePicker
                                value={dateFrom ?? ''}
                                onChange={(v) => setDateFrom(v || null)}
                                placeholder="From (optional)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <DatePicker
                                value={dateTo ?? ''}
                                onChange={(v) => setDateTo(v || null)}
                                placeholder="To (optional)"
                            />
                        </div>
                        <Button onClick={fetchReport} disabled={loading}>
                            {loading ? 'Loading…' : 'Apply'}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        {error}
                    </div>
                )}

                {data && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total accounts</CardTitle>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.summary.total}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {data.summary.active} active · {data.summary.inactive} inactive
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.summary.active}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.summary.inactive}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">By type</CardTitle>
                                    <PieChart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        {Object.entries(data.summary.by_type || {}).length > 0
                                            ? Object.entries(data.summary.by_type)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 3)
                                                .map(([type, count]) => (
                                                    <div key={type} className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground truncate">{type}</span>
                                                        <span className="font-medium">{count}</span>
                                                    </div>
                                                ))
                                            : '—'}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {Object.entries(data.summary.by_type || {}).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Count by account type</CardTitle>
                                    <CardDescription>Number of accounts per type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(data.summary.by_type)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([type, count]) => (
                                                <div key={type} className="rounded-lg border px-4 py-2">
                                                    <span className="text-muted-foreground">{type}: </span>
                                                    <span className="font-semibold">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Accounts and usage</CardTitle>
                                <CardDescription>
                                    {data.date_from || data.date_to
                                        ? 'Usage and amounts in selected time range'
                                        : 'Each account and how many disbursement line items reference it (all time)'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Account name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Usage count</TableHead>
                                            {(data.date_from || data.date_to) && (
                                                <>
                                                    <TableHead className="text-right">Debit</TableHead>
                                                    <TableHead className="text-right">Credit</TableHead>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.accounts_with_usage.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={data.date_from || data.date_to ? 7 : 5} className="text-center text-muted-foreground">
                                                    No accounts
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.accounts_with_usage.map((acc) => (
                                                <TableRow key={acc.id}>
                                                    <TableCell className="font-mono">{acc.account_code}</TableCell>
                                                    <TableCell>{acc.account_name}</TableCell>
                                                    <TableCell>{acc.account_type}</TableCell>
                                                    <TableCell>{acc.status}</TableCell>
                                                    <TableCell className="text-right">{acc.usage_count}</TableCell>
                                                    {(data.date_from || data.date_to) && (
                                                        <>
                                                            <TableCell className="text-right">{formatCurrency(acc.total_debit ?? 0)}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(acc.total_credit ?? 0)}</TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
