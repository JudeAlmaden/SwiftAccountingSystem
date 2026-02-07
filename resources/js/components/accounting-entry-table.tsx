import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Plus, X, Search } from 'lucide-react';
import { route } from 'ziggy-js';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AccountSearchDropdown from '@/components/account-search-dropdown';
import { DottedSeparator } from '@/components/dotted-line';

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    account_type: string;
}

interface AccountingRow {
    id: string;
    account: Account | null;
    ref: string;
    debit: number | null;
    credit: number | null;
}

interface AccountingEntryTableProps {
    title: string;
    date: string;
    description: string;
    recommended_by: string;
    onTitleChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onRecommendedByChange: (value: string) => void;
    onSave?: () => void;
    onCancel?: () => void;
    saveButtonText?: string;
    cancelButtonText?: string;
    onDataChange?: (data: any) => void;
    isLoading?: boolean;
    errors?: Record<string, string[]>;
}

export default function AccountingEntryTable({
    title,
    date,
    description,
    recommended_by,
    onTitleChange,
    onDateChange,
    onDescriptionChange,
    onRecommendedByChange,
    onSave,
    onCancel,
    saveButtonText = 'Save',
    cancelButtonText = 'Cancel',
    onDataChange,
    isLoading = false,
    errors = {},
}: AccountingEntryTableProps) {
    const [rows, setRows] = useState<AccountingRow[]>([
        { id: '1', account: null, ref: '', debit: 0, credit: null },
        { id: '2', account: null, ref: '', debit: 0, credit: null },
        { id: '3', account: null, ref: '', debit: 0, credit: null },
    ]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [allAccounts, setAllAccounts] = useState<Account[]>([]);
    const [isAccountsLoading, setIsAccountsLoading] = useState(false);

    // Get CSRF token
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    // Fetch all accounts once on mount for optimized selection
    useEffect(() => {
        setIsAccountsLoading(true);
        fetch(`${route('accounts.index')}?all=true`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(res => res.json())
            .then(data => {
                setAllAccounts(data.data || []);
                setIsAccountsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch accounts pre-emptively', err);
                setIsAccountsLoading(false);
            });
    }, [token]);

    const addNewRow = () => {
        const newId = String(Math.max(...rows.map(r => parseInt(r.id) || 0), 0) + 1);
        setRows([...rows, { id: newId, account: null, ref: '', debit: 0, credit: null }]);
    };

    const deleteRow = (id: string) => {
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, updates: Partial<AccountingRow>) => {
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

    // Prepare data in the format expected by the backend
    const preparedData = useMemo(() => {
        return {
            title,
            date,
            description,
            recommended_by,
            accounts: rows
                .filter(row => row.account !== null)
                .map((row, index) => ({
                    account_id: row.account?.id,
                    type: (row.debit ?? 0) > 0 ? 'debit' : 'credit',
                    amount: (row.debit ?? 0) > 0 ? (row.debit ?? 0) : (row.credit ?? 0),
                    order_number: index + 1,
                })),
        };
    }, [title, date, description, rows]);

    // Notify parent component when data changes (using useEffect instead of useMemo)
    useEffect(() => {
        if (onDataChange) {
            onDataChange(preparedData);
        }
    }, [preparedData, onDataChange]);

    return (
        <Card className="border-border p-0 overflow-visible">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse relative table-fixed">
                    <thead>
                        <tr className="border-b border-border bg-table-head overflow-hidden rounded-t-md">
                            <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wider w-auto first:rounded-tl-lg">
                                Account
                            </th>
                            <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider border-l border-white/10 w-32">
                                Ref
                            </th>
                            <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 w-40">
                                Debit
                            </th>
                            <th className="px-6 py-5 text-center text-xs font-bold text-white uppercase tracking-wider w-40">
                                Credit
                            </th>
                            <th className="w-16 last:rounded-tr-lg" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const hasDebit = row.debit !== null && row.debit > 0;
                            const hasCredit = row.credit !== null && row.credit > 0;

                            return (
                                <tr
                                    key={row.id}
                                    className={`border-b border-border ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
                                        } hover:bg-zinc-100/80 transition-colors group`}
                                >
                                    <td className="px-6 py-4 static">
                                        <div className="flex items-center gap-2 relative">
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)}
                                                className="flex flex-1 items-center gap-3 text-left p-1 rounded-md transition-colors hover:bg-secondary/20 group/select"
                                                title="Select account"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background group-hover/select:border-primary/30 group-hover/select:text-primary transition-colors shrink-0">
                                                    <Search size={14} className="opacity-40 group-hover/select:opacity-100" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-sm font-semibold truncate ${row.account ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {row.account?.account_name || 'Select Account'}
                                                    </span>
                                                    {row.account && (
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                            {row.account.account_code} • {row.account.account_type}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronDown size={14} className="ml-auto opacity-30 group-hover/select:opacity-100 transition-opacity" />
                                            </button>
                                            {openDropdownId === row.id && (
                                                <AccountSearchDropdown
                                                    accounts={allAccounts}
                                                    onSelect={(account) => selectAccount(row.id, account)}
                                                    onClose={() => setOpenDropdownId(null)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center border-l border-border">
                                        <input
                                            type="text"
                                            value={row.ref}
                                            onChange={(e) => updateRow(row.id, { ref: e.target.value })}
                                            disabled={!row.account}
                                            placeholder=""
                                            className="w-full bg-transparent text-center text-sm font-medium text-foreground outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
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
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                                            title="Delete row"
                                        >
                                            <X size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        <tr className="bg-white">
                            <td colSpan={5} className="px-6 py-6 text-center">
                                <Button
                                    onClick={addNewRow}
                                    variant="outline"
                                    className="gap-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-600 shadow-none transition-all"
                                >
                                    <Plus size={16} />
                                    Add New Accounting Entry
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-border bg-zinc-100">
                            <td className="px-6 py-4 text-left font-bold text-zinc-900 uppercase text-xs tracking-wider">
                                Total Summary
                            </td>
                            <td className="px-6 py-4 text-right border-l border-border/10"></td>
                            <td className="px-6 py-4 text-center border-r border-border/10">
                                <span className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-zinc-400'}`}>
                                    {totals.debitSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-zinc-400'}`}>
                                    {totals.creditSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="bg-zinc-100" />
                        </tr>
                    </tfoot>
                </table>
            </div>
            <DottedSeparator />
            <div className="px-5 pb-4 border-border bg-card flex items-center justify-between">
                <div className="text-xs text-muted-foreground italic">
                    {!isBalanced && "Debit and Credit must be balanced."}
                    {isBalanced && rows.filter(r => r.account).length === 0 && "Add at least one accounting entry."}
                    {isBalanced && rows.filter(r => r.account).length > 0 && (!title || !date || !description) && "Please fill in all required fields."}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                        {cancelButtonText}
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={!isBalanced || rows.filter(r => r.account).length === 0 || !title || !date || !description || isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold transition-all hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {saveButtonText}
                    </Button>
                </div>
            </div>
            {Object.keys(errors).some(k => k.startsWith('attachments')) && (
                <div className="px-6 pb-4 pt-0">
                    <p className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
                        {errors[Object.keys(errors).find(k => k.startsWith('attachments'))!][0]}
                    </p>
                </div>
            )}
        </Card>
    );
}
