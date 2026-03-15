import { Head, Link, usePage, router } from '@inertiajs/react';
import html2pdf from 'html2pdf.js';
import { ArrowLeft, Calendar, FileText, Tag, Info, AlertCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { DottedSeparator } from '@/components/dotted-line';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
// @ts-ignore
import type { Journal } from '@/types/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { JournalSidebar } from './components/JournalSidebar';
import { VoucherTemplateDisbursement } from './components/VoucherTemplateDisbursement';
import { VoucherTemplateJournal } from './components/VoucherTemplateJournal';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard')
    }, {
        title: 'Vouchers',
        href: route('vouchers.index')
    }, {
        title: 'View Voucher',
        href: '#'
    }
];

export default function View() {
    const { journal: initialJournal, auth, user: propsUser } = usePage<any>().props;
    const user = auth?.user || propsUser || {};
    const userRoles = user?.roles || [];

    const [journal, setJournal] = useState<Journal | null>(initialJournal);

    // Sync state if props change (e.g. after a router action)
    useEffect(() => {
        setJournal(initialJournal);
    }, [initialJournal]);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [declineRemarks, setDeclineRemarks] = useState('');
    const [isApproveStep5ModalOpen, setIsApproveStep5ModalOpen] = useState(false);
    const [checkId, setCheckId] = useState('');
    const [sheetSize, setSheetSize] = useState<'full' | 'half'>(() => {
        const saved = localStorage.getItem('voucherSheetSize');
        return (saved === 'half' || saved === 'full') ? saved : 'full';
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'approve' | 'decline' | null>(null);

    useEffect(() => {
        localStorage.setItem('voucherSheetSize', sheetSize);
    }, [sheetSize]);

    const handleAction = (action: 'approve' | 'decline', remarks?: string, checkIdValue?: string) => {
        if (!journal) return;

        if (action === 'decline' && !remarks) {
            setIsDeclineModalOpen(true);
            return;
        }

        const currentStep = Number(journal.current_step) || 1;

        if (action === 'approve' && isLastStep(currentStep) && !checkIdValue && journal.type !== 'journal') {
            setIsApproveStep5ModalOpen(true);
            return;
        }

        setPendingAction(action);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!pendingAction || !journal) return;

        setIsConfirmModalOpen(false);
        setIsActionLoading(true);

        const endpoint = pendingAction === 'approve'
            ? route('journals.approve', { id: journal.id })
            : route('journals.decline', { id: journal.id });

        const data: any = {
            remarks: pendingAction === 'approve' ? 'Approved through dashboard.' : (declineRemarks || 'Declined through dashboard.')
        };

        const currentStep = Number(journal.current_step) || 1;
        if (pendingAction === 'approve' && isLastStep(currentStep) && checkId) {
            data.check_id = checkId;
        }

        router.post(endpoint, data, {
            onSuccess: () => {
                setIsDeclineModalOpen(false);
                setDeclineRemarks('');
                setIsApproveStep5ModalOpen(false);
                setCheckId('');
                setPendingAction(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                alert(firstError || `Failed to ${pendingAction} journal.`);
            },
            onFinish: () => {
                setIsActionLoading(false);
            }
        });
    };

    const isLastStep = (step: number) => {
        const flow = journal?.step_flow || [];
        return flow.length > 0 ? step === flow.length : step === 5;
    };

    const canPerformAction = () => {
        if (!journal || journal.status !== 'pending') return false;

        const currentStep = Number(journal.current_step) || 1;
        const stepFlow = journal.step_flow ?? [];
        const stepConfig = stepFlow[currentStep - 1];

        const stepRole = stepConfig?.role;
        const restrictedToUserId = stepConfig?.user_id ?? null;

        const rolesLower = (userRoles || []).map((r: string) => r.toLowerCase());
        const userId = user?.id;

        if (restrictedToUserId != null && userId !== restrictedToUserId) return false;
        if (stepRole && rolesLower.includes(stepRole.toLowerCase())) return true;

        if (!stepRole && !restrictedToUserId) {
            if (currentStep === 1 && rolesLower.includes('accounting assistant')) return true;
        }

        return false;
    };

    const getStatusBadgeVariant = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePrint = () => {
        const element = document.getElementById('voucher-paper');
        if (!element) return;

        const pdfFormat = sheetSize === 'half' ? 'a5' : 'a4';

        const opt = {
            margin: 0,
            filename: `Voucher_${journal?.control_number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                foreignObjectRendering: false,
                onclone: (doc: Document) => {
                    const style = doc.createElement("style");
                    style.innerHTML = `
                        * {
                            color: rgb(0,0,0) !important;
                            background-color: rgb(255,255,255) !important;
                            border-color: rgb(0,0,0) !important;
                            box-sizing: border-box !important;
                        }
                    `;
                    doc.head.appendChild(style);
                }
            },
            jsPDF: { unit: 'mm', format: pdfFormat, orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt as any).save().catch((err: any) => {
            console.error('PDF Generation failed:', err);
            alert('Failed to generate PDF. Please try using the browser print function (Ctrl+P).');
        });
    };

    const RejectionNotice = () => {
        if (journal?.status !== 'rejected') return null;

        const rejectionTracking = journal.tracking
            ?.filter(t => t.action === 'rejected' && t.acted_at)
            .sort((a, b) => new Date(b.acted_at!).getTime() - new Date(a.acted_at!).getTime())[0];

        if (!rejectionTracking) return null;

        return (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive mb-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-500 p-3">
                <XCircle className="h-5 w-5 mt-1" />
                <div className="ml-2">
                    <AlertTitle className="font-bold text-lg mb-2 flex items-center gap-2">
                        Voucher Rejected
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Reason:</span>
                            <span className="italic opacity-90">"{rejectionTracking.remarks}"</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                            <span className="bg-destructive text-white px-2 py-1 rounded">Rejected by {rejectionTracking.role}</span>
                            <span>•</span>
                            <span className="opacity-90">{formatDate(rejectionTracking.acted_at ?? undefined)}</span>
                        </div>
                    </AlertDescription>
                </div>
            </Alert>
        );
    };


    if (!journal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Voucher Not Found" />
                <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                    <h2 className="text-2xl font-bold">Voucher Not Found</h2>
                    <Button asChild>
                        <Link href={route('vouchers.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Vouchers
                        </Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Voucher - ${journal.control_number}`} />
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('vouchers.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{journal.control_number}</h2>
                            <p className="text-muted-foreground">Detailed voucher view and accounting record.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="text-sm px-3 py-1" variant={getStatusBadgeVariant(journal.status)}>
                            {journal.status?.toUpperCase()}
                        </Badge>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Sheet size:</span>
                            <Select value={sheetSize} onValueChange={(v) => setSheetSize(v as 'full' | 'half')}>
                                <SelectTrigger className="h-8 w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Full (A4)</SelectItem>
                                    <SelectItem value="half">Half (A5)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {journal.status === 'approved' && (
                            <Button variant="outline" onClick={handlePrint} className="hidden sm:flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Download PDF
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
                    <div className="flex flex-col gap-6 w-full min-w-0">
                        <RejectionNotice />
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-primary -ml-1" />
                                    Voucher Info
                                </CardTitle>
                                <p className='ml-7 -mt-1 text-sm opacity-60'>Record of approved fund journals</p>
                            </CardHeader>
                            <DottedSeparator />
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-10 pb-1">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        Title
                                    </p>
                                    <p className="text-sm ml-5 font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap">{journal.title}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Date Created
                                    </p>
                                    <p className="text-sm ml-5 font-semibold">{formatDate(journal.created_at)}</p>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Info className="h-3 w-3" />
                                        Description
                                    </p>
                                    <p className="text-sm ml-5 text-foreground">
                                        {journal.description || 'No description provided.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        { }
                        <div className="overflow-x-auto pb-4 flex justify-center bg-gray-100/50 rounded-xl border p-2 sm:p-4">
                            <div className="w-full max-w-[210mm] min-w-0">
                                {journal.type === 'journal'
                                    ? <VoucherTemplateJournal journal={journal} sheetSize={sheetSize} />
                                    : <VoucherTemplateDisbursement disbursement={journal} sheetSize={sheetSize} />
                                }
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="sticky top-6 mb-16">
                        <JournalSidebar
                            currentStep={Number(journal.current_step) || 1}
                            stepFlow={journal.step_flow}
                            tracking={journal.tracking}
                            attachments={journal.attachments}
                        />
                    </div>
                </div>
            </div>

            { }
            {canPerformAction() && (
                <div className="fixed bottom-6 right-8 flex items-center gap-3 z-50 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Button
                        variant="destructive"
                        onClick={() => handleAction('decline')}
                        disabled={isActionLoading}
                        className="h-10 px-5 rounded-full shadow-lg font-semibold"
                    >
                        {isActionLoading ? 'Processing...' : 'Decline'}
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => handleAction('approve')}
                        disabled={isActionLoading}
                        className="h-10 px-6 rounded-full shadow-lg font-semibold"
                    >
                        {isActionLoading ? 'Processing...' : 'Approve Voucher'}
                    </Button>
                </div>
            )}

            { }
            <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Decline Voucher
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for declining this voucher. This will be sent as a notification to the person who generated it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter your reason here..."
                            value={declineRemarks}
                            onChange={(e) => setDeclineRemarks(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeclineModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={!declineRemarks.trim() || isActionLoading}
                            onClick={() => handleAction('decline', declineRemarks)}
                        >
                            {isActionLoading ? 'Processing...' : 'Confirm Decline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            { }
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingAction === 'approve' ? 'Approve Voucher' : 'Decline Voucher'}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {pendingAction === 'approve' ? 'approve' : 'decline'} this voucher?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                        <Button
                            variant={pendingAction === 'approve' ? 'default' : 'destructive'}
                            onClick={handleConfirmAction}
                        >
                            {pendingAction === 'approve' ? 'Approve' : 'Decline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            { }
            <Dialog open={isApproveStep5ModalOpen} onOpenChange={setIsApproveStep5ModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <Info className="h-5 w-5" />
                            Final Approval - Enter Check ID
                        </DialogTitle>
                        <DialogDescription>
                            This is the final step. Please enter the check ID to complete the approval process.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="check_id" className="text-sm font-medium">
                                Check ID <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="check_id"
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter check number or ID..."
                                value={checkId}
                                onChange={(e) => setCheckId(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveStep5ModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!checkId.trim() || isActionLoading}
                            onClick={() => handleAction('approve', 'Final approval with check ID.', checkId)}
                        >
                            {isActionLoading ? 'Processing...' : 'Approve & Complete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
