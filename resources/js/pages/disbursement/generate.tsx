import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import type { BreadcrumbItem } from '@/types';
import AccountingEntryTable from '@/components/accounting-entry-table';
import { DisbursementAttachment } from './components/DisbursementAttachment';
import { DottedSeparator } from '@/components/dotted-line';

interface ControlNumberPrefixOption {
    id: number;
    code: string;
    label: string | null;
    sort_order: number;
}

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
        title: 'Create Disbursement',
        href: route('disbursement.generate'),
    },
];

export default function GenerateDisbursement() {
    const today = new Date().toISOString().split('T')[0];
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(today);
    const [description, setDescription] = useState('');
    const [recommendedBy, setRecommendedBy] = useState('');
    const [disbursementData, setDisbursementData] = useState<any>(null);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [prefixes, setPrefixes] = useState<ControlNumberPrefixOption[]>([]);
    const [controlNumberPrefixId, setControlNumberPrefixId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const TITLE_MAX_LENGTH = 50;
    const DESCRIPTION_MAX_LENGTH = 70;

    useEffect(() => {
        fetch('/api/control-number-prefixes', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load prefixes')))
            .then((data) => {
                const list = data.data || [];
                setPrefixes(list);
                if (list.length > 0 && !controlNumberPrefixId) {
                    setControlNumberPrefixId(String(list[0].id));
                }
            })
            .catch(console.error);
    }, []);

    // When prefixes load, select first if none selected
    useEffect(() => {
        if (prefixes.length > 0 && !controlNumberPrefixId) {
            setControlNumberPrefixId(String(prefixes[0].id));
        }
    }, [prefixes, controlNumberPrefixId]);

    const handleSave = () => {
        if (!disbursementData) return;
        if (!controlNumberPrefixId) {
            setErrors({ control_number_prefix_id: ['Please select a control number prefix.'] });
            return;
        }
        setIsSubmitting(true);
        setErrors({});

        // Get fresh CSRF token
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        const csrfToken = meta?.content || '';

        const formData = new FormData();

        // Append basic info
        formData.append('title', disbursementData.title);
        formData.append('date', disbursementData.date);
        formData.append('description', disbursementData.description);
        formData.append('recommended_by', disbursementData.recommended_by || '');
        formData.append('control_number_prefix_id', controlNumberPrefixId);

        // Append accounting entries
        formData.append('accounts', JSON.stringify(disbursementData.accounts));

        // Append temp IDs of uploaded files
        attachments.forEach((tempId) => {
            formData.append('attachments[]', tempId);
        });

        fetch(route('disbursements.store'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
            },
            body: formData,
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    if (response.status === 422) {
                        setErrors(data.errors || {});
                        throw new Error('Validation failed');
                    }
                    if (response.status === 419) {
                        throw new Error('CSRF token mismatch. Please refresh the page and try again.');
                    }
                    throw new Error(data.message || 'Something went wrong');
                }
                return data;
            })
            .then(data => {
                if (data.id) {
                    router.visit(route('disbursement.view', { id: data.id }));
                }
            })
            .catch(error => {
                console.error('Error saving disbursement:', error);
                alert(error.message || 'Failed to save disbursement. Please try again.');
                setIsSubmitting(false);
            });
    };

    const handleCancel = () => {
        window.history.back();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Disbursement" />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-6">
                    <Card>
                        <div className="px-10 py-6">
                            <div className="grid gap-4 grid-cols-[2fr_1fr_1fr]">
                                <div>
                                    <label htmlFor="title" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                        Title
                                        <span className="text-destructive text-xs">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.length <= TITLE_MAX_LENGTH) {
                                                    setTitle(value);
                                                }
                                            }}
                                            maxLength={TITLE_MAX_LENGTH}
                                            placeholder="Disbursement - December 31, 2024"
                                            className={`bg-background border-gray-400 border-[1.6px] focus-visible:ring-primary pr-14 ${errors.title ? 'border-destructive' : ''}`}
                                        />
                                        {title.length > 0 && (
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-all duration-200 animate-in fade-in ${title.length >= TITLE_MAX_LENGTH - 10 ? 'text-red-500' : 'text-muted-foreground'
                                                }`}>
                                                {title.length}/{TITLE_MAX_LENGTH}
                                            </span>
                                        )}
                                        
                                    </div>
                                    {errors.title && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.title[0]}</p>}
                                </div>
                                
                                <div>
                                    <label htmlFor="prefix" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                        Control number prefix
                                        <span className="text-destructive text-xs">*</span>
                                    </label>
                                    <Select value={controlNumberPrefixId} onValueChange={setControlNumberPrefixId}>
                                        <SelectTrigger id="prefix" className={`border-gray-400 border-[1.6px] text-xs text-muted-foreground ${errors.control_number_prefix_id ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="Select prefix" className="text-xs text-muted-foreground" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {prefixes.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                                    {p.code} {p.label ? `– ${p.label}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.control_number_prefix_id && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.control_number_prefix_id[0]}</p>}
                                </div>

                                <div>
                                    <label htmlFor="date" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                        Date of transaction
                                        <span className="text-destructive text-xs">*</span>
                                    </label>
                                    <Input
                                        id="date"
                                        value={new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        readOnly
                                        disabled
                                        className="bg-muted border-gray-400 border-[1.6px] cursor-not-allowed"
                                    />
                                    {errors.date && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.date[0]}</p>}
                                </div>
                            </div>
                            <div className="mt-6">
                                <label htmlFor="description" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                    Description
                                    <span className="text-destructive text-xs">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.length <= DESCRIPTION_MAX_LENGTH) {
                                                setDescription(value);
                                            }
                                        }}
                                        maxLength={DESCRIPTION_MAX_LENGTH}
                                        placeholder="Add any notes or details about this disbursement..."
                                        className={`bg-background focus-visible:ring-primary shadow-sm pr-14 ${errors.description ? 'border-destructive' : ''}  border-gray-400 border-[1.6px]`}
                                    />
                                    {description.length > 0 && (
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-all duration-200 animate-in fade-in ${description.length >= DESCRIPTION_MAX_LENGTH - 10 ? 'text-red-500' : 'text-muted-foreground'
                                            }`}>
                                            {description.length}/{DESCRIPTION_MAX_LENGTH}
                                        </span>
                                    )}
                                </div>
                                {errors.description && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.description[0]}</p>}
                            </div>
                            <div className="mt-6">
                                <label htmlFor="recommended_by" className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                    Recommended By
                                    <span className="text-muted-foreground text-[10px] font-normal italic ml-1">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        id="recommended_by"
                                        value={recommendedBy}
                                        onChange={(e) => setRecommendedBy(e.target.value)}
                                        placeholder="Name of the person recommending this disbursement..."
                                        className={`bg-background focus-visible:ring-primary shadow-sm border-gray-400 border-[1.6px] ${errors.recommended_by ? 'border-destructive' : ''}`}
                                    />
                                </div>
                                {errors.recommended_by && <p className="text-[10px] text-destructive mt-1 font-medium">{errors.recommended_by[0]}</p>}
                            </div>
                        </div>
                    </Card>

                    <AccountingEntryTable
                        title={title}
                        date={date}
                        description={description}
                        recommended_by={recommendedBy}
                        onTitleChange={setTitle}
                        onDateChange={setDate}
                        onDescriptionChange={setDescription}
                        onRecommendedByChange={setRecommendedBy}
                        onDataChange={setDisbursementData}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        saveButtonText={isSubmitting ? "Saving..." : "Save Disbursement"}
                        isLoading={isSubmitting}
                        errors={errors}
                    />
                </div>

                <div className="sticky top-5 self-start h-fit max-h-[calc(100vh-6rem)] overflow-auto">
                    <DisbursementAttachment onFilesChange={setAttachments} />
                </div>
            </div>
        </AppLayout>
    );
}
