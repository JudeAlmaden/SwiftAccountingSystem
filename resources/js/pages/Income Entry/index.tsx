import { Head, usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import AccountingEntryTable from '@/components/accounting-entry-table';
import { toast } from 'sonner';

// Modular Components
import IncomeEntryCalendar from './components/IncomeEntryCalendar';
import IncomeEntryList from './components/IncomeEntryList';

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

    const handleAddIncome = () => {
        const formattedDate = date ? format(date, 'MMMM do, yyyy') : '';
        setTitle(`Manual Income Entry - ${formattedDate}`);
        setDescription(`Manual income record for ${formattedDate}`);
        setIsAddingEntry(true);
    };

    const handleEditEntry = (entry: any) => {
        setEditingEntry(entry);
        setTitle(entry.title);
        setDescription(entry.description);
        setIsAddingEntry(true);
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
                    <div className="md:col-span-4 lg:col-span-3 h-fit">
                        <IncomeEntryCalendar
                            date={date}
                            onDateChange={handleDateChange}
                            entriesDates={entriesDates}
                            pendingEditDates={pendingEditDates}
                        />
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
                        {!isAddingEntry ? (
                            <IncomeEntryList
                                date={date}
                                entries={propsEntries}
                                isToday={isToday}
                                canAddIncome={canAddIncome}
                                roles={roles}
                                onAddIncome={handleAddIncome}
                                onEditEntry={handleEditEntry}
                            />
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

