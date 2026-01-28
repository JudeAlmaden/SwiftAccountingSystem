import React, { useState, useMemo } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AccountSearchDropdown from '@/components/account-search-dropdown';
import { DottedSeparator } from '@/components/dotted-line';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Disbursements',
        href: route('disbursements'),
    },
    {
        title: 'Generate',
        href: route('disbursement.generate'),
    },
];

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    account_type: string;
}

interface DisbursementRow {
    id: string;
    account: Account | null;
    debit: number | null;
    credit: number | null;
}

export default function GenerateDisbursement() {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [rows, setRows] = useState<DisbursementRow[]>([
        { id: '1', account: null, debit: 0, credit: null },
        { id: '2', account: null, debit: 0, credit: null },
        { id: '3', account: null, debit: 0, credit: null },
    ]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const addNewRow = () => {
        const newId = String(Math.max(...rows.map(r => parseInt(r.id) || 0), 0) + 1);
        setRows([...rows, { id: newId, account: null, debit: 0, credit: null }]);
    };

    const deleteRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, updates: Partial<DisbursementRow>) => {
        setRows(rows.map(row => (row.id === id ? { ...row, ...updates } : row)));
    };

    const selectAccount = (id: string, account: Account) => {
        updateRow(id, { account });
        setOpenDropdownId(null);
    };

    const totals = useMemo(() => {
        const debitSum = rows.reduce((sum, row) => sum + (row.debit || 0), 0);
        const creditSum = rows.reduce((sum, row) => sum + (row.credit || 0), 0);
        return { debitSum, creditSum };
    }, [rows]);

    const isBalanced = totals.debitSum === totals.creditSum;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Disbursement" />

            <Card className="border-border bg-card overflow-visible">
                <div className="bg-card border-b border-border p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                                Title
                            </label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Disbursement - December 31, 2024"
                                className="bg-background"
                            />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                                Date
                            </label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add any notes or details about this disbursement..."
                            className="bg-background"
                        />
                    </div>
                </div>

                <DottedSeparator className="my-4" color="#d1d5db" />

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse relative table-fixed">
                        <thead>
                            <tr className="border-b border-border bg-green-500">
                                <th className="px-6 py-4 text-left text-sm font-bold text-white w-auto">
                                    Account
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-white border-l border-white/20 border-r border-white/20 w-40">
                                    Debit
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-white w-40">
                                    Credit
                                </th>
                                <th className="w-16 bg-green-500" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => {
                                const hasDebit = row.debit !== null && row.debit > 0;
                                const hasCredit = row.credit !== null && row.credit > 0;

                                return (
                                    <tr
                                        key={row.id}
                                        className={`border-b border-border ${index % 2 === 0 ? 'bg-white' : 'bg-green-50'
                                            } hover:bg-green-100`}
                                    >
                                        <td className="px-6 py-4 static">
                                            <div className="flex items-center gap-2 relative">
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)}
                                                    className="flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors hover:text-accent shrink-0"
                                                    title="Select account"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">
                                                        {row.account?.account_name || 'Select Account'}
                                                    </span>
                                                    {row.account && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {row.account.account_code} - {row.account.account_type}
                                                        </span>
                                                    )}
                                                </div>
                                                {openDropdownId === row.id && (
                                                    <AccountSearchDropdown
                                                        onSelect={(account) => selectAccount(row.id, account)}
                                                        onClose={() => setOpenDropdownId(null)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-l border-r border-border">
                                            {hasCredit ? (
                                                <span className="text-muted-foreground">---</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={row.debit ?? 0}
                                                    onChange={(e) => {
                                                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                                                        updateRow(row.id, { debit: value, credit: null });
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    disabled={!row.account}
                                                    className="w-24 bg-transparent text-center text-sm font-semibold text-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {hasDebit ? (
                                                <span className="text-muted-foreground">---</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={row.credit ?? 0}
                                                    onChange={(e) => {
                                                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                                                        updateRow(row.id, { credit: value, debit: null });
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    disabled={!row.account}
                                                    className="w-24 bg-transparent text-center text-sm font-semibold text-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => deleteRow(row.id)}
                                                className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
                                                title="Delete row"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            <tr className="bg-white">
                                <td colSpan={4} className="px-6 py-4">
                                    <Button onClick={addNewRow} variant="ghost" className="gap-2 text-green-500 hover:text-green-600 hover:bg-transparent shadow-none border-0">
                                        <Plus size={16} />
                                        Add Entry
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-border bg-green-500">
                                <td className="px-6 py-4 text-left font-bold text-white">
                                    Total
                                </td>
                                <td className="px-6 py-4 text-center border-l border-r border-white/20">
                                    <span className="text-lg font-bold text-white">
                                        {totals.debitSum.toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-bold text-white">
                                        {totals.creditSum.toLocaleString()}
                                    </span>
                                </td>
                                <td className="bg-green-500" />
                            </tr>
                        </tfoot>
                    </table>
                </div>


                <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Cancel
                    </Button>
                    <Button disabled={!isBalanced || rows.length === 0}>
                        Save Disbursement
                    </Button>
                </div>
            </Card>
        </AppLayout>
    );
}
