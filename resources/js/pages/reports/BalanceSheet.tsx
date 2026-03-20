import { Head, router } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useState, Fragment } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Balance Sheet', href: route('balance-sheet.index') },
];

interface AccountData {
    id: number;
    account_name: string;
    account_code: string;
    account_description: string | null;
    account_type: string;
    sub_account_type: string;
    balance: number;
    total_debit: number;
    total_credit: number;
    group?: {
        id: number;
        name: string;
        grp_code: string;
    };
}

interface Props {
    balanceSheetData: AccountData[];
    filters: {
        end_date: string;
    };
}

export default function BalanceSheet({ balanceSheetData, filters }: Props) {
    const [endDate, setEndDate] = useState(filters.end_date);
    const [loading, setLoading] = useState(false);

    const data = balanceSheetData || [];

    const fetchData = () => {
        if (!endDate) {
            alert('Please select an end date.');
            return;
        }
        setLoading(true);
        router.get(route('balance-sheet.index'), { end_date: endDate }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setLoading(false),
        });
    };

    const handleResetFilter = () => {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setEndDate(today);
        setLoading(true);
        router.get(route('balance-sheet.index'), { end_date: today }, {
            preserveState: true, preserveScroll: true, replace: true,
            onFinish: () => setLoading(false),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    // Calculate totals by type
    const totalAssets = Math.round(data.filter(item => item.account_type === 'Assets').reduce((sum, item) => sum + Number(item.balance), 0) * 100) / 100;
    const totalLiabilities = Math.round(data.filter(item => item.account_type === 'Liabilities').reduce((sum, item) => sum + Number(item.balance), 0) * 100) / 100;
    const totalEquity = Math.round(data.filter(item => item.account_type === 'Equity').reduce((sum, item) => sum + Number(item.balance), 0) * 100) / 100;

    const handlePrint = () => {
        window.print();
    };

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Balance Sheet">
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #balance-sheet-print-area,
                        #balance-sheet-print-area * {
                            visibility: visible;
                        }
                        #balance-sheet-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        #balance-sheet-print-area table {
                            font-size: 10px !important;
                        }
                        #balance-sheet-print-area td,
                        #balance-sheet-print-area th {
                            padding: 2px 3px !important;
                            line-height: 1.3 !important;
                        }
                        @page {
                            size: portrait;
                            margin: 0.4cm;
                        }
                    }
                `}</style>
            </Head>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl text-header">Balance Sheet</h2>
                        <p className="text-muted-foreground">Statement of Financial Position as of a specific date.</p>
                    </div>
                </div>

                <div className="rounded-sm border bg-card p-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                        <div className="grid gap-2 w-full sm:w-auto">
                            <Label htmlFor="end_date">As Of Date</Label>
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="Select date"
                            />
                        </div>
                        <Button onClick={fetchData} disabled={loading || !endDate}>
                            {loading ? 'Filtering...' : 'Filter Report'}
                        </Button>
                        <Button
                            onClick={handleResetFilter}
                            disabled={loading}
                            variant="outline"
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={handlePrint}
                            disabled={data.length === 0}
                            variant="outline"
                            className="gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>

                    {loading && (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading balance sheet data...
                        </div>
                    )}

                    {!loading && data.length > 0 && (
                        <div id="balance-sheet-print-area" className="flex flex-col gap-8">
                            {/* Assets Table */}
                            <div className="rounded-sm border bg-card overflow-hidden">
                                <h3 className="bg-green-600 text-white font-bold px-4 py-2 text-sm uppercase">ASSETS</h3>
                                <Table className="border-collapse border border-black">
                                    <TableHeader>
                                        <TableRow className="bg-green-50 p-0 hover:bg-green-50">
                                            <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black w-24 text-center h-8">ACCT CODE</TableHead>
                                            <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black text-center h-8">ACCOUNT TITLE</TableHead>
                                            <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black w-48 text-center h-8">AMOUNT</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.filter(i => i.account_type === 'Assets').map((item, idx) => (
                                            <TableRow key={item.id} className={idx % 2 === 0 ? "bg-white hover:bg-green-50/20" : "bg-green-50/10 hover:bg-green-50/30"}>
                                                <TableCell className="px-2 py-1 text-xs border border-black font-mono text-black">
                                                    <a
                                                        href={item.id !== 0 ? route('accounts.show', { id: item.id }) : '#'}
                                                        target={item.id !== 0 ? "_blank" : undefined}
                                                        rel="noopener noreferrer"
                                                        className={item.id !== 0 ? "hover:underline text-blue-800" : "pointer-events-none"}
                                                    >
                                                        {item.account_code}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="px-2 py-1 text-xs border border-black text-black uppercase font-medium">
                                                    <a
                                                        href={item.id !== 0 ? route('accounts.show', { id: item.id }) : '#'}
                                                        target={item.id !== 0 ? "_blank" : undefined}
                                                        rel="noopener noreferrer"
                                                        className={item.id !== 0 ? "hover:underline text-blue-800" : "pointer-events-none"}
                                                    >
                                                        {item.account_name}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="px-2 py-1 text-xs border border-black text-right font-mono text-black">{formatCurrency(item.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-green-100 font-bold border-t-2 border-black">
                                            <TableCell colSpan={2} className="px-2 py-2 text-right text-xs border border-black text-black">TOTAL ASSETS</TableCell>
                                            <TableCell className="px-2 py-2 text-right text-xs border border-black text-green-900 font-bold">{formatCurrency(totalAssets)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Liabilities & Equity Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Liabilities Table */}
                                <div className="rounded-sm border bg-card overflow-hidden">
                                    <h3 className="bg-green-600 text-white font-bold px-4 py-2 text-sm uppercase">LIABILITIES</h3>
                                    <Table className="border-collapse border border-black">
                                        <TableHeader>
                                            <TableRow className="bg-green-50 hover:bg-green-50">
                                                <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black text-center h-8">ACCOUNT TITLE</TableHead>
                                                <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black w-32 text-center h-8">AMOUNT</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.filter(i => i.account_type === 'Liabilities').length === 0 ? (
                                                <TableRow><TableCell colSpan={2} className="text-center py-4 text-xs italic">No Liabilites recorded</TableCell></TableRow>
                                            ) : (
                                                data.filter(i => i.account_type === 'Liabilities').map((item, idx) => (
                                                    <TableRow key={item.id} className={idx % 2 === 0 ? "bg-white hover:bg-green-50/20" : "bg-green-50/10 hover:bg-green-50/30"}>
                                                        <TableCell className="px-2 py-1 text-xs border border-black text-black uppercase font-medium">
                                                            <a
                                                                href={item.id !== 0 ? route('accounts.show', { id: item.id }) : '#'}
                                                                target={item.id !== 0 ? "_blank" : undefined}
                                                                rel="noopener noreferrer"
                                                                className={item.id !== 0 ? "hover:underline text-blue-800" : "pointer-events-none"}
                                                            >
                                                                {item.account_name}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell className="px-2 py-1 text-xs border border-black text-right font-mono text-black">{formatCurrency(item.balance)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                            <TableRow className="bg-green-100 font-bold border-t-2 border-black">
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-black">TOTAL LIABILITIES</TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-green-900 font-bold">{formatCurrency(totalLiabilities)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Equity Table */}
                                <div className="rounded-sm border bg-card overflow-hidden">
                                    <h3 className="bg-green-600 text-white font-bold px-4 py-2 text-sm uppercase">EQUITY</h3>
                                    <Table className="border-collapse border border-black">
                                        <TableHeader>
                                            <TableRow className="bg-green-50 hover:bg-green-50">
                                                <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black text-center h-8">ACCOUNT TITLE</TableHead>
                                                <TableHead className="text-black font-bold px-2 py-1 text-xs border border-black w-32 text-center h-8">AMOUNT</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.filter(i => i.account_type === 'Equity').map((item, idx) => (
                                                <TableRow key={item.id} className={idx % 2 === 0 ? "bg-white hover:bg-green-50/20" : "bg-green-50/10 hover:bg-green-50/30"}>
                                                    <TableCell className="px-2 py-1 text-xs border border-black text-black uppercase font-medium">
                                                        <a
                                                            href={item.id !== 0 ? route('accounts.show', { id: item.id }) : '#'}
                                                            target={item.id !== 0 ? "_blank" : undefined}
                                                            rel="noopener noreferrer"
                                                            className={item.id !== 0 ? "hover:underline text-blue-800" : "pointer-events-none"}
                                                        >
                                                            {item.account_name}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="px-2 py-1 text-xs border border-black text-right font-mono text-black">{formatCurrency(item.balance)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-green-100 font-bold border-t-2 border-black">
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-black">TOTAL EQUITY</TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-green-900 font-bold">{formatCurrency(totalEquity)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Verification Totals */}
                            <div className="mt-4 p-4 rounded-sm border-2 border-dashed border-green-200 bg-green-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-xl font-bold flex gap-4">
                                    <span className="text-green-800">Assets: {formatCurrency(totalAssets)}</span>
                                    <span className="text-gray-400">=</span>
                                    <span className="text-green-800">L + E: {formatCurrency(totalLiabilities + totalEquity)}</span>
                                </div>
                                <div>
                                    {isBalanced ? (
                                        <div className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                            ✓ Balanced
                                        </div>
                                    ) : (
                                        <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                            ⚠ Out of balance by {formatCurrency(Math.abs(totalAssets - (totalLiabilities + totalEquity)))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && data.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            No accounting data found for the selected date. Ensure journals are approved.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
