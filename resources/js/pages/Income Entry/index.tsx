import { Head, usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Info, ReceiptText, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import AccountingEntryTable from '@/components/accounting-entry-table';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Income Entry',
        href: route('income-entry.index'),
    },
];

export default function IncomeEntry() {
    const { auth, user: propsUser, prefixes, entries: propsEntries, selectedDate, dayStatuses } = usePage<any>().props;
    const user = auth?.user || propsUser || {};
    const roles = user?.roles || [];
    const isAccountingHead = roles.some((role: string) => role.toLowerCase() === 'accounting head');

    const [date, setDate] = useState<Date | undefined>(selectedDate ? new Date(selectedDate) : new Date());
    const [isAddingEntry, setIsAddingEntry] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, any>>({});
    const [editingEntry, setEditingEntry] = useState<any>(null);

    // Entry Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [journalData, setJournalData] = useState<any>(null);

    const isToday = date ? format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') : false;
    const canAddIncome = isAccountingHead && isToday && (!propsEntries || propsEntries.length === 0);

    const entriesDates = Object.keys(dayStatuses || {}).map(d => new Date(d));
    const pendingEditDates = Object.entries(dayStatuses || {})
        .filter(([_, s]: any) => s.pending_edit)
        .map(([d, _]) => new Date(d));

    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);
        setIsAddingEntry(false);
        setEditingEntry(null);
        if (newDate) {
            router.get(route('income-entry.index'),
                { date: format(newDate, 'yyyy-MM-dd') },
                { preserveState: true, preserveScroll: true, only: ['entries', 'selectedDate', 'dayStatuses'] }
            );
        }
    };


    const handleSave = () => {
        if (!journalData) return;

        const mPrefix = prefixes?.find((p: any) => p.code === 'MIE');
        if (!mPrefix && (!prefixes || prefixes.length === 0)) {
            toast.error('No control number prefix available.');
            return;
        }

        const url = editingEntry ? route('income-entry.update', { id: editingEntry.id }) : route('income-entry.store');

        router.post(url, {
            _method: editingEntry ? 'put' : 'post',
            title: journalData.title,
            date: journalData.date,
            description: journalData.description,
            control_number_prefix_id: mPrefix?.id || prefixes[0]?.id,
            accounts: journalData.accounts,
        }, {
            onStart: () => setIsSubmitting(true),
            onSuccess: () => {
                const isHistorical = editingEntry && format(new Date(editingEntry.created_at), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
                toast.success(editingEntry
                    ? (isHistorical ? 'Edit request sent to Auditor for approval' : 'Income entry updated successfully')
                    : 'Income entry recorded successfully'
                );
                setIsAddingEntry(false);
                setEditingEntry(null);
                setTitle('');
                setDescription('');
                setErrors({});
            },
            onError: (err) => {
                setErrors(err);
                toast.error('Failed to save income entry. Please check the form.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const initialRows = editingEntry ? editingEntry.items?.map((item: any) => ({
        id: String(item.id),
        account: item.account,
        ref: '',
        debit: item.type === 'debit' ? parseFloat(item.amount) : null,
        credit: item.type === 'credit' ? parseFloat(item.amount) : null,
    })) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Income Entry" />

            <div className="flex flex-col gap-6 mb-24">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-header">Income Entry</h2>
                    <p className="text-muted-foreground">Manage and record daily income streams.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Calendar */}
                    <Card className="md:col-span-4 lg:col-span-3 h-fit">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Date</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={handleDateChange}
                                className="rounded-md border-none"
                                showOutsideDays={true}
                                modifiers={{
                                    hasEntry: entriesDates,
                                    pendingEdit: pendingEditDates,
                                }}
                            />

                        </CardContent>
                    </Card>

                    {/* Right Column: Details & Actions */}
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
                        {!isAddingEntry ? (
                            <Card className="flex-1 min-h-[400px]">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {date ? format(date, 'MMMM d, yyyy') : 'No Date Selected'}
                                            {isToday && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Today</span>}
                                            {propsEntries?.some((e: any) => e.status === 'pending' && e.proposed_data) && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider animate-pulse">Pending Edit Approval</span>
                                            )}
                                        </CardTitle>

                                        <CardDescription>
                                            {propsEntries?.length || 0} income entry recorded for this day.
                                        </CardDescription>
                                    </div>
                                    {canAddIncome && (
                                        <Button className="gap-2" onClick={() => {
                                            const formattedDate = date ? format(date, 'MMMM do, yyyy') : '';
                                            setTitle(`Manual Income Entry - ${formattedDate}`);
                                            setDescription(`Manual income record for ${formattedDate}`);
                                            setIsAddingEntry(true);
                                        }}>
                                            <Plus className="h-4 w-4" />
                                            <span>Add Income</span>
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-6 px-10">
                                    {propsEntries && propsEntries.length > 0 ? (
                                        <div className="space-y-8">
                                            {propsEntries.map((entry: any) => (
                                                <div key={entry.id} className="space-y-6">
                                                    {/* Items Table Only */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">Accounting Details</p>
                                                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                            <table className="w-full text-sm text-left">
                                                                <thead className="bg-[#159630] text-primary-foreground text-[10px] uppercase tracking-wider font-bold">
                                                                    <tr>
                                                                        <th className="px-6 py-3.5">Account</th>
                                                                        <th className="px-6 py-3.5 text-right w-[150px]">Debit</th>
                                                                        <th className="px-6 py-3.5 text-right w-[150px]">Credit</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border bg-white">
                                                                    {entry.items?.map((item: any) => (
                                                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                                            <td className="px-6 py-3.5">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-foreground text-[13px]">{item.account?.account_name || 'Unknown Account'}</span>
                                                                                    <span className="text-[11px] text-muted-foreground font-medium">{item.account?.account_code}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-foreground">
                                                                                {item.type === 'debit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                            </td>
                                                                            <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-foreground">
                                                                                {item.type === 'credit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                                <tfoot className="bg-muted/20 font-bold border-t-[1.6px] border-[#159630]/30">
                                                                    <tr>
                                                                        <td className="px-6 py-4 uppercase tracking-wider text-[11px] text-foreground">Total Summary</td>
                                                                        <td className="px-6 py-4 text-right tabular-nums text-[#159630] text-[15px]">
                                                                            {entry.items?.filter((i: any) => i.type === 'debit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right tabular-nums text-[#159630] text-[15px]">
                                                                            {entry.items?.filter((i: any) => i.type === 'credit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-4 pb-2">
                                                        {roles.some((r: string) => r.toLowerCase() === 'auditor') && entry.status === 'pending' && entry.proposed_data && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="gap-2 bg-green-600 hover:bg-green-700 h-9 font-bold"
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to approve these historical changes?')) {
                                                                            router.post(route('vouchers.approve', { id: entry.id }), {}, {
                                                                                onSuccess: () => toast.success('Historical edit approved and applied successfully.')
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <span>Approve Edit</span>
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="gap-2 h-9 font-bold"
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to decline these historical changes?')) {
                                                                            router.post(route('vouchers.decline', { id: entry.id }), {}, {
                                                                                onSuccess: () => toast.success('Historical edit request declined.')
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <span>Decline Edit</span>
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {roles.some((r: string) => r.toLowerCase() === 'accounting head') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={entry.status === 'pending' && entry.proposed_data}
                                                                className="gap-2 border-primary/50 border-[1.6px] h-9 text-primary hover:bg-primary/5 font-semibold disabled:opacity-70"
                                                                onClick={() => {
                                                                    setEditingEntry(entry);
                                                                    setTitle(entry.title);
                                                                    setDescription(entry.description);
                                                                    setIsAddingEntry(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                                <span>{entry.status === 'pending' && entry.proposed_data ? 'Pending Approval' : 'Edit Entry'}</span>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {entry.status === 'pending' && entry.proposed_data && (
                                                        <div className="mt-10 space-y-6 border-t-2 border-dashed border-amber-200 pt-8">
                                                            <div className="flex items-center justify-between pb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-amber-100 p-2 rounded-lg">
                                                                        <Info className="h-5 w-5 text-amber-600" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight">Proposed New Changes</h4>
                                                                        <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Historical Edit Request</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full uppercase font-black tracking-widest border-2 border-amber-200 animate-pulse">Pending Review</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest ml-1">New Title</p>
                                                                    <div className="px-4 py-3 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg text-sm font-bold text-amber-900 shadow-sm">
                                                                        {entry.proposed_data.title}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest ml-1">New Description</p>
                                                                    <div className="px-4 py-3 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg text-sm font-bold text-amber-900 shadow-sm italic">
                                                                        "{entry.proposed_data.description}"
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-3 ml-1">New Accounting Details</p>
                                                                <div className="border-2 border-amber-200 rounded-xl overflow-hidden shadow-lg">
                                                                    <table className="w-full text-sm text-left">
                                                                        <thead className="bg-amber-500 text-white text-[11px] uppercase tracking-widest font-black">
                                                                            <tr>
                                                                                <th className="px-6 py-4">Account</th>
                                                                                <th className="px-6 py-4 text-right w-[150px]">Debit</th>
                                                                                <th className="px-6 py-4 text-right w-[150px]">Credit</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-amber-100 bg-white">
                                                                            {entry.proposed_data.accounts?.map((item: any, idx: number) => {
                                                                                const acc = (usePage<any>().props.accounts as any[])?.find(a => a.id === item.account_id);
                                                                                return (
                                                                                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                                                                        <td className="px-6 py-4 font-bold text-amber-900 text-[13px]">
                                                                                            <div className="flex flex-col">
                                                                                                <span className="font-bold text-amber-900">{acc?.account_name || 'Unknown Account'}</span>
                                                                                                <span className="text-[11px] text-amber-600/80 font-black uppercase tracking-tighter">{acc?.account_code}</span>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-6 py-4 text-right font-black tabular-nums text-amber-900 text-base">
                                                                                            {item.type === 'debit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                                        </td>
                                                                                        <td className="px-6 py-4 text-right font-black tabular-nums text-amber-900 text-base">
                                                                                            {item.type === 'credit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                        <tfoot className="bg-amber-50 font-black border-t-2 border-amber-200">
                                                                            <tr>
                                                                                <td className="px-6 py-5 uppercase tracking-widest text-[12px] text-amber-900">Total Proposed Summary</td>
                                                                                <td className="px-6 py-5 text-right tabular-nums text-amber-600 text-[18px]">
                                                                                    {entry.proposed_data.accounts?.filter((i: any) => i.type === 'debit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                                </td>
                                                                                <td className="px-6 py-5 text-right tabular-nums text-amber-600 text-[18px]">
                                                                                    {entry.proposed_data.accounts?.filter((i: any) => i.type === 'credit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                                </td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full pt-20 text-center pb-20">
                                            <div className="bg-muted/50 rounded-full p-6 mb-4">
                                                {canAddIncome ? (
                                                    <ReceiptText className="h-10 w-10 text-primary/60" />
                                                ) : (
                                                    <Info className="h-10 w-10 text-muted-foreground/60" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground/80">
                                                {canAddIncome ? "Ready to record income?" : "No entries found"}
                                            </h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                                                {canAddIncome
                                                    ? "As an Accounting Head, you can record a manual income entry for today. Click the button above to start."
                                                    : propsEntries && propsEntries.length > 0
                                                        ? "A manual income entry has already been recorded for this date."
                                                        : "It looks like there are no income entries recorded for this date."}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6 pb-10">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle>{editingEntry ? 'Edit' : 'Manual'} Income Entry - {date ? format(date, 'PPP') : ''}</CardTitle>
                                        <CardDescription>{editingEntry ? 'Modify' : 'Enter'} multi-line accounting entries for this income transaction.</CardDescription>
                                    </CardHeader>
                                    <div className="px-10 py-6">
                                        <div className="grid gap-4 grid-cols-1">
                                            <div>
                                                <label htmlFor="title" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                                    Title
                                                    <span className="text-destructive text-xs">*</span>
                                                </label>
                                                <Input
                                                    id="title"
                                                    value={title}
                                                    disabled
                                                    placeholder="e.g., Daily Sales Collection"
                                                    className={`bg-background border-gray-400 border-[1.6px] opacity-70 cursor-not-allowed focus-visible:ring-primary ${errors.title ? 'border-destructive' : ''}`}
                                                />
                                                {errors.title && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.title[0]}</p>}
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="description" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                                    Description
                                                    <span className="text-destructive text-xs">*</span>
                                                </label>
                                                <Input
                                                    id="description"
                                                    value={description}
                                                    disabled
                                                    placeholder="Provide details about the income source..."
                                                    className={`bg-background border-gray-400 border-[1.6px] opacity-70 cursor-not-allowed focus-visible:ring-primary ${errors.description ? 'border-destructive' : ''}`}
                                                />
                                                {errors.description && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.description[0]}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <AccountingEntryTable
                                    title={title}
                                    date={date ? format(date, 'yyyy-MM-dd') : ''}
                                    description={description}
                                    onTitleChange={setTitle}
                                    onDateChange={() => { }} // Date is fixed to selected date
                                    onDescriptionChange={setDescription}
                                    onDataChange={setJournalData}
                                    onSave={handleSave}
                                    onCancel={() => {
                                        setIsAddingEntry(false);
                                        setEditingEntry(null);
                                    }}
                                    saveButtonText={isSubmitting ? (editingEntry ? "Updating..." : "Recording...") : (editingEntry ? "Update Entry" : "Record Income")}
                                    isLoading={isSubmitting}
                                    errors={errors}
                                    initialRows={initialRows}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
