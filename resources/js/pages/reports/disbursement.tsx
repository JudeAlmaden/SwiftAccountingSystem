import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useCallback, useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
    FileText,
    Banknote,
    TrendingUp,
    ArrowDownCircle,
    Printer,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Disbursement Reports', href: route('reports.disbursements') },
];

type Period = 'daily' | 'monthly' | 'yearly';

interface Summary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    total_debit: number;
    total_credit: number;
    total_expense: number;
    total_disbursed: number;
    total_approved_amount: number;
}

interface ByPeriodItem {
    total_debit: number;
    total_credit: number;
    total_expense: number;
    total_disbursed: number;
    count: number;
}

interface ByAccountItem {
    account_id: number;
    account_name: string;
    account_code: string;
    account_type: string;
    total_debit: number;
    total_credit: number;
    total: number;
}

interface ByAccountRankItem extends ByAccountItem {
    rank: number;
}

interface DailyTrendRow {
    date: string;
    total_disbursed: number;
    pending_amount: number;
    approved_amount: number;
    rejected_amount: number;
    vouchers: number;
}

interface DailyTrend {
    rows: DailyTrendRow[];
    previous_period_total: number;
    current_period_total: number;
    pct_change: number;
}

interface TopAccountRow {
    rank: number;
    account_id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    total_disbursed: number;
    vouchers: number;
    pct_of_total: number;
}

interface VoucherDetailRow {
    id: number;
    control_number: string;
    date: string;
    account: string;
    amount: number;
    status: string;
    approver: string;
    pending_days: number;
    remarks: string;
}

interface WorkflowInsights {
    pending_pct: number;
    rejected_pct: number;
    approved_pct: number;
    avg_days_to_approve: number;
    max_days_pending: number;
    vouchers_above_100k: number;
}

interface ReportData {
    period: Period;
    date_from: string;
    date_to: string;
    summary: Summary;
    metrics_table?: Array<{ metric: string; amount: number | string; notes: string }>;
    daily_trend?: DailyTrend;
    top_accounts?: TopAccountRow[];
    by_period: Record<string, ByPeriodItem>;
    by_account: ByAccountItem[];
    account_ranking_by_expense: ByAccountRankItem[];
    voucher_details?: VoucherDetailRow[];
    workflow?: WorkflowInsights;
    disbursements_by_period: Record<string, { pending: number; approved: number; rejected: number; total: number }>;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function defaultDateFrom(): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth());
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

export default function DisbursementReportPage() {
    const [period, setPeriod] = useState<Period>('monthly');
    const [dateFrom, setDateFrom] = useState(() => defaultDateFrom());
    const [dateTo, setDateTo] = useState(() => defaultDateTo());
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
            period,
            date_from: dateFrom,
            date_to: dateTo,
        });
        // Use web route path so session auth is used (API route has same name and uses Sanctum).
        const url = `/dashboard/reports/disbursements/data?${params}`;
        fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then((res) => {
                if (!res.ok) {
                    return res.text().then((text) => {
                        let msg = 'Failed to load report';
                        try {
                            const j = JSON.parse(text);
                            if (j.message) msg = j.message;
                        } catch {
                            if (res.status === 401) msg = 'Please log in again.';
                            else if (res.status === 403) msg = 'You do not have permission to view this report.';
                            else if (res.status >= 500) msg = 'Server error. Try again later.';
                        }
                        throw new Error(msg);
                    });
                }
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load disbursement report.'))
            .finally(() => setLoading(false));
    }, [period, dateFrom, dateTo]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handlePrint = () => {
        window.print();
    };

    if (loading && !data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Disbursement Reports" />
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                    Loading report…
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disbursement Reports" />
            <div className="report-print-root min-w-0 space-y-8 overflow-x-auto">
                <div className="print:hidden">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Disbursement Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Aggregated disbursement summary by time range with expense and account breakdown
                    </p>
                </div>

                {/* Period and date range */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle className="text-base">Time range</CardTitle>
                        <CardDescription>
                            Choose period grouping and date range for the report
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
                                value={dateFrom}
                                onChange={setDateFrom}
                                placeholder="From date"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <DatePicker
                                value={dateTo}
                                onChange={setDateTo}
                                placeholder="To date"
                            />
                        </div>
                        <Button onClick={fetchReport} disabled={loading}>
                            {loading ? 'Loading…' : 'Apply'}
                        </Button>
                        {data && (
                            <Button variant="outline" onClick={handlePrint} className="gap-2 print:hidden">
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive print:hidden">
                        {error}
                    </div>
                )}

                {data && (
                    <div id="report-paper" className="min-w-0 space-y-8">
                        <div className="pb-4 border-b">
                            <h2 className="text-xl font-semibold">Disbursement Report</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {data.date_from} to {data.date_to} · Grouped by {data.period}
                            </p>
                        </div>
                        {/* 1. Metrics table */}
                        {data.metrics_table && data.metrics_table.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Summary metrics</CardTitle>
                                    <CardDescription>Key amounts and counts for the selected period</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Metric</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.metrics_table.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{row.metric}</TableCell>
                                                    <TableCell className="text-right">
                                                        {typeof row.amount === 'number' && row.metric !== 'Total Vouchers' && !String(row.amount).includes('/')
                                                            ? formatCurrency(row.amount)
                                                            : row.amount}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{row.notes}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Summary cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total expense</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(data.summary.total_expense)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Debits (approved) in range
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total disbursed</CardTitle>
                                    <Banknote className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(data.summary.total_disbursed)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Credits (approved) in range
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total debit / credit</CardTitle>
                                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-semibold">
                                        {formatCurrency(data.summary.total_debit)} / {formatCurrency(data.summary.total_credit)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        All statuses in range
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Disbursements</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{data.summary.total}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Pending: {data.summary.pending} · Approved: {data.summary.approved} · Rejected: {data.summary.rejected}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 2. Daily disbursement trend */}
                        {data.daily_trend && data.daily_trend.rows.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daily disbursement trend</CardTitle>
                                    <CardDescription>
                                        Totals by date. Vs previous period: {data.daily_trend.pct_change >= 0 ? '+' : ''}{data.daily_trend.pct_change}% change in disbursed amount.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Total Disbursed</TableHead>
                                                <TableHead className="text-right">Pending</TableHead>
                                                <TableHead className="text-right">Approved</TableHead>
                                                <TableHead className="text-right">Rejected</TableHead>
                                                <TableHead className="text-right">Vouchers</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.daily_trend.rows.map((row) => (
                                                <TableRow key={row.date}>
                                                    <TableCell className="font-medium">{row.date}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.total_disbursed)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.pending_amount)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.approved_amount)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.rejected_amount)}</TableCell>
                                                    <TableCell className="text-right">{row.vouchers}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* By period */}
                        {Object.keys(data.by_period).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>By {period}</CardTitle>
                                    <CardDescription>
                                        Expense and disbursed amount per {period === 'daily' ? 'day' : period === 'monthly' ? 'month' : 'year'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(data.by_period)
                                            .sort(([a], [b]) => b.localeCompare(a))
                                            .map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                                                >
                                                    <span className="font-medium">{key}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        Expense: {formatCurrency(val.total_expense)} · Disbursed: {formatCurrency(val.total_disbursed)} · Vouchers: {val.count}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3. Top accounts by disbursement (approved) */}
                        {data.top_accounts && data.top_accounts.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top accounts by disbursement</CardTitle>
                                    <CardDescription>
                                        Approved vouchers only. % of total highlights concentration.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">Rank</TableHead>
                                                <TableHead>Account Code</TableHead>
                                                <TableHead>Account Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Total Disbursed (Approved)</TableHead>
                                                <TableHead className="text-right">Vouchers</TableHead>
                                                <TableHead className="text-right">% of total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.top_accounts.map((row) => (
                                                <TableRow key={row.account_id}>
                                                    <TableCell className="font-semibold">{row.rank}</TableCell>
                                                    <TableCell className="font-mono">{row.account_code}</TableCell>
                                                    <TableCell>{row.account_name}</TableCell>
                                                    <TableCell>{row.account_type}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(row.total_disbursed)}</TableCell>
                                                    <TableCell className="text-right">{row.vouchers}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{row.pct_of_total}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Account ranking by expense */}
                        {data.account_ranking_by_expense?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account ranking by expense</CardTitle>
                                    <CardDescription>
                                        Accounts ranked by total debit (expense) in the selected time range
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">Rank</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Account</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Expense (Debit)</TableHead>
                                                <TableHead className="text-right">Credit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.account_ranking_by_expense.map((row) => (
                                                <TableRow key={row.account_id}>
                                                    <TableCell className="font-semibold">{row.rank}</TableCell>
                                                    <TableCell className="font-mono">{row.account_code}</TableCell>
                                                    <TableCell>{row.account_name}</TableCell>
                                                    <TableCell>{row.account_type}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(row.total_debit)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.total_credit)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* 4. Voucher-level details (audit) */}
                        {data.voucher_details && data.voucher_details.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Voucher-level details</CardTitle>
                                    <CardDescription>
                                        Audit list: voucher no, date, account, amount, status, approver, pending days, remarks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Voucher No</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Account</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Approver</TableHead>
                                                <TableHead className="text-right">Pending days</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.voucher_details.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell className="font-mono font-medium">{row.control_number}</TableCell>
                                                    <TableCell>{row.date}</TableCell>
                                                    <TableCell className="max-w-[140px] truncate" title={row.account}>{row.account}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                                                    <TableCell>{row.status}</TableCell>
                                                    <TableCell>{row.approver}</TableCell>
                                                    <TableCell className="text-right">{row.pending_days}</TableCell>
                                                    <TableCell className="max-w-[160px] truncate text-muted-foreground" title={row.remarks}>{row.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* 5. Status / Workflow insights */}
                        {data.workflow && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Status / Workflow insights</CardTitle>
                                    <CardDescription>
                                        Pending and rejection rates, approval timing, large vouchers
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Metric</TableHead>
                                                <TableHead className="text-right">Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Pending % of total vouchers</TableCell>
                                                <TableCell className="text-right">{data.workflow.pending_pct}%</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Approved % of total vouchers</TableCell>
                                                <TableCell className="text-right">{data.workflow.approved_pct}%</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Rejected % of total vouchers</TableCell>
                                                <TableCell className="text-right">{data.workflow.rejected_pct}%</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Avg days to approve</TableCell>
                                                <TableCell className="text-right">{data.workflow.avg_days_to_approve} days</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Max days pending</TableCell>
                                                <TableCell className="text-right">{data.workflow.max_days_pending} days</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Vouchers &gt; ₱100k</TableCell>
                                                <TableCell className="text-right">{data.workflow.vouchers_above_100k}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* By account */}
                        {data.by_account.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>By account</CardTitle>
                                    <CardDescription>
                                        Debit and credit totals per account in the selected time range
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Account</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Credit</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.by_account.map((row) => (
                                                <TableRow key={row.account_id}>
                                                    <TableCell className="font-mono">{row.account_code}</TableCell>
                                                    <TableCell>{row.account_name}</TableCell>
                                                    <TableCell>{row.account_type}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.total_debit)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.total_credit)}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(row.total)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
