import { useState } from 'react';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import type { BreadcrumbItem } from '@/types';
import AccountingEntryTable from '@/components/accounting-entry-table';

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

export default function GenerateDisbursement() {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [disbursementData, setDisbursementData] = useState<any>(null);

    const handleSave = () => {
        console.log('Saving disbursement:', disbursementData);
        // TODO: Add mo malupetang route mo dito IDOL
    };

    const handleCancel = () => {
        window.history.back();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Disbursement" />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <AccountingEntryTable
                    title={title}
                    date={date}
                    description={description}
                    onTitleChange={setTitle}
                    onDateChange={setDate}
                    onDescriptionChange={setDescription}
                    onDataChange={setDisbursementData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saveButtonText="Save Disbursement"
                />
   
                <div className="space-y-6">
                    <Card className="border-border bg-card p-6 h-[200px] flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
                            <p className="text-xs text-muted-foreground mt-1">Upload supporting documents</p>
                        </div>
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent transition-colors cursor-pointer mb-4">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-sm font-medium text-foreground">Upload Files</p>
                                    <p className="text-xs text-muted-foreground">Click to browse</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex-1 overflow-y-auto"></div>
                    </Card>
          
                    <Card className="border-border bg-card p-6">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-foreground">Status Tracking</h3>
                            <p className="text-xs text-muted-foreground mt-1">Approval workflow progress</p>
                        </div>
                        <div className="relative">                        
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border"></div>

                            <div className="space-y-6">                          
                                <div className="flex items-center gap-4 relative">
                                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 z-10">
                                        <div className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-[ping_2s_ease-in-out_infinite]"></div>
                                        <svg
                                            className="relative h-3 w-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Accounting Assistant</p>
                                        <p className="text-xs text-muted-foreground">Pending approval</p>
                                    </div>
                                </div>
      
                                <div className="flex items-center gap-4 relative">
                                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center z-10">
                                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Accounting Head</p>
                                        <p className="text-xs text-muted-foreground">Awaiting</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 relative">
                                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center z-10">
                                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Auditor</p>
                                        <p className="text-xs text-muted-foreground">Awaiting</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 relative">
                                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center z-10">
                                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">SVP</p>
                                        <p className="text-xs text-muted-foreground">Awaiting</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
