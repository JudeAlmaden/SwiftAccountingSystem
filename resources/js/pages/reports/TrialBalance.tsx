import { Head } from '@inertiajs/react';
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
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Trial Balance',
        href: route('trial-balance.index'),
    },
];

interface AccountData {
    id: number;
    account_name: string;
    account_code: string;
    account_description: string | null;
    account_type: string;
    sub_account_type: string;
    total_debit: number;
    total_credit: number;
    group?: {
        id: number;
        name: string;
        grp_code: string;
    };
}

export default function TrialBalance() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState<AccountData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchData = async () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        setLoading(true);
        try {
            const url = new URL(route('api.trial-balance.data'));
            url.searchParams.set('start_date', startDate);
            url.searchParams.set('end_date', endDate);

            const res = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            const result = await res.json();
            setData(result.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Error fetching trial balance:', error);
            alert('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    // Calculate totals
    const totalDebit = data.reduce((sum, item) => sum + Number(item.total_debit), 0);
    const totalCredit = data.reduce((sum, item) => sum + Number(item.total_credit), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trial Balance">
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #trial-balance-print-area,
                        #trial-balance-print-area * {
                            visibility: visible;
                        }
                        #trial-balance-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        #trial-balance-print-area table {
                            font-size: 10px !important;
                        }
                        #trial-balance-print-area td,
                        #trial-balance-print-area th {
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
                        <h2 className="text-3xl text-header">Trial Balance</h2>
                        <p className="text-muted-foreground">Generate trial balance report based on approved disbursements.</p>
                    </div>
                </div>

                <div className="rounded-sm border bg-card p-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                        <div className="grid gap-2 w-full sm:w-auto">
                            <Label htmlFor="start_date">Start Date</Label>
                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="Select start date"
                            />
                        </div>
                        <div className="grid gap-2 w-full sm:w-auto">
                            <Label htmlFor="end_date">End Date</Label>
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="Select end date"
                            />
                        </div>
                        <Button onClick={fetchData} disabled={loading || !startDate || !endDate}>
                            {loading ? 'Generating...' : 'Generate Report'}
                        </Button>
                        <Button 
                            onClick={handlePrint} 
                            disabled={!hasSearched || data.length === 0}
                            variant="outline"
                            className="gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                    </div>

                    {hasSearched && (
                        <div id="trial-balance-print-area" className="rounded-sm border bg-card overflow-hidden">
                            <Table className="border-collapse border border-black">
                                <TableHeader>
                                    <TableRow className="bg-green-600 p-0 hover:bg-green-600">
                                        <TableHead className="text-white font-bold px-2 py-1 text-xs border border-black w-16 text-center h-8">GRP CODE</TableHead>
                                        <TableHead className="text-white font-bold px-2 py-1 text-xs border border-black w-24 text-center h-8">ACCT CODE</TableHead>
                                        <TableHead className="text-white font-bold px-2 py-1 text-xs border border-black text-center h-8">ACCOUNT TITLE</TableHead>
                                        <TableHead className="text-white font-bold px-2 py-1 text-xs border border-black w-32 text-center h-8">DEBIT</TableHead>
                                        <TableHead className="text-white font-bold px-2 py-1 text-xs border border-black w-32 text-center h-8">CREDIT</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center p-8 text-black border border-black text-xs">
                                                No records found for the selected date range.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {data.map((item, index) => {
                                                const prevItem = index > 0 ? data[index - 1] : null;

                                                // Hierarchical grouping checks
                                                const showTypeHeader = !prevItem || prevItem.account_type !== item.account_type;
                                                const showSubTypeHeader = !prevItem || prevItem.sub_account_type !== item.sub_account_type || showTypeHeader;
                                                const showGroupHeader = item.group && (!prevItem?.group || prevItem.group.id !== item.group?.id || showSubTypeHeader);

                                                // Alternating row colors with subtle green
                                                const rowBgClass = index % 2 === 0 ? "bg-white hover:bg-green-50/30" : "bg-green-50/20 hover:bg-green-50/40";

                                                return (
                                                    <Fragment key={item.id}>
                                                        {/* Account Type Header */}
                                                        {showTypeHeader && (
                                                            <TableRow className="bg-green-100 hover:bg-green-100">
                                                                <TableCell colSpan={5} className="font-extrabold px-2 py-1 text-xs uppercase border border-black text-black">
                                                                    {item.account_type}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}

                                                        {/* Sub-Account Type Header */}
                                                        {showSubTypeHeader && (
                                                            <TableRow className="bg-green-50 hover:bg-green-50">
                                                                <TableCell colSpan={5} className="font-bold px-2 py-1 text-xs uppercase pl-6 border border-black text-black">
                                                                    {item.sub_account_type}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}

                                                        {/* Account Group Header */}
                                                        {showGroupHeader && (
                                                            <TableRow className="bg-green-50/30 hover:bg-green-50/50">
                                                                <TableCell colSpan={5} className="font-semibold px-2 py-1 text-xs italic pl-10 border border-black text-black">
                                                                    {item.group?.name} <span className="opacity-70 font-normal ml-1">({item.group?.grp_code})</span>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}

                                                        <TableRow className={rowBgClass}>
                                                            <TableCell className="px-2 py-1 text-xs border border-black text-center h-auto font-mono text-black align-top">
                                                                {item.group?.grp_code || ''}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1 text-xs border border-black h-auto font-mono text-black align-top">
                                                                <a
                                                                    href={route('accounts.view', { id: item.id })}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="hover:underline text-blue-800"
                                                                >
                                                                    {item.account_code}
                                                                </a>
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1 text-xs border border-black h-auto text-black align-top">
                                                                <div className="flex flex-col">
                                                                    <a
                                                                        href={route('accounts.view', { id: item.id })}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="font-medium uppercase hover:underline text-blue-800"
                                                                    >
                                                                        {item.account_name}
                                                                    </a>
                                                                    {item.account_description && item.account_description !== item.account_name && (
                                                                        <span className="text-[10px] text-gray-600 italic leading-tight mt-0.5">{item.account_description}</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1 text-xs border border-black text-right h-auto font-mono text-black align-top">
                                                                {item.total_debit > 0 ? formatCurrency(item.total_debit) : ''}
                                                            </TableCell>
                                                            <TableCell className="px-2 py-1 text-xs border border-black text-right h-auto font-mono text-black align-top">
                                                                {item.total_credit > 0 ? formatCurrency(item.total_credit) : ''}
                                                            </TableCell>
                                                        </TableRow>
                                                    </Fragment>
                                                );
                                            })}
                                            <TableRow className="bg-green-100 font-bold border-t-2 border-black hover:bg-green-100">
                                                <TableCell colSpan={3} className="px-2 py-2 text-right text-xs border border-black text-black">TOTAL</TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-blue-900 font-bold">{formatCurrency(totalDebit)}</TableCell>
                                                <TableCell className="px-2 py-2 text-right text-xs border border-black text-green-900 font-bold">{formatCurrency(totalCredit)}</TableCell>
                                            </TableRow>
                                            {/* Check if balanced */}
                                            <TableRow className={Math.abs(totalDebit - totalCredit) < 0.01 ? "bg-green-50" : "bg-red-50"}>
                                                <TableCell colSpan={5} className="text-center py-2 text-sm border border-black">
                                                    {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                                                        <span className="text-green-700 font-bold flex items-center justify-center gap-2">✓ Balanced</span>
                                                    ) : (
                                                        <span className="text-red-700 font-bold flex items-center justify-center gap-2">⚠ Out of balance by {formatCurrency(Math.abs(totalDebit - totalCredit))}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// Helper to check same group
function isSameGroup(item1: AccountData, item2: AccountData) {
    if (!item1.group && !item2.group) return true;
    if (!item1.group || !item2.group) return false;
    return item1.group.name === item2.group.name && item1.group.grp_code === item2.group.grp_code;
}
