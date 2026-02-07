import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Disbursement } from '@/types/database';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, FileText, Tag, Info, AlertCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { VoucherTemplate } from './components/VoucherTemplate';
import { DisbursementSidebar } from './components/DisbursementSidebar';
import { DottedSeparator } from '@/components/dotted-line';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard')
    }, {
        title: 'Disbursements',
        href: route('disbursements')
    }, {
        title: 'View Disbursement',
        href: '#'
    }
];

type PageProps = {
    id: number
}

export default function View() {
    const { id, user } = usePage<any>().props;
    const userRoles = user?.roles || [];

    const [disbursement, setDisbursement] = useState<Disbursement | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [declineRemarks, setDeclineRemarks] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(route('disbursements.show', { id }), {
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await res.json();
            setDisbursement(data.disbursement);
        } catch (err) {
            console.error('Failed to fetch disbursement', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAction = async (action: 'approve' | 'decline', remarks?: string) => {
        if (!disbursement) return;

        if (action === 'decline' && !remarks) {
            setIsDeclineModalOpen(true);
            return;
        }

        const confirmMsg = action === 'approve'
            ? 'Are you sure you want to approve this disbursement?'
            : 'Are you sure you want to decline this disbursement?';

        if (!confirm(confirmMsg)) return;

        setIsActionLoading(true);
        try {
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const token = meta?.content || '';

            const endpoint = action === 'approve'
                ? route('disbursements.approve', { id: disbursement.id })
                : route('disbursements.decline', { id: disbursement.id });

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    remarks: remarks || (action === 'approve' ? 'Approved through dashboard.' : 'Declined through dashboard.')
                })
            });

            if (res.ok) {
                setIsDeclineModalOpen(false);
                setDeclineRemarks('');
                await fetchData(); // Refresh data
            } else {
                const data = await res.json();
                alert(data.message || `Failed to ${action} disbursement.`);
            }
        } catch (err) {
            console.error(`Error during ${action}:`, err);
            alert(`An error occurred while trying to ${action} the disbursement.`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const canPerformAction = () => {
        if (!disbursement || disbursement.status !== 'pending') return false;

        const step = disbursement.step;

        if (userRoles.includes('admin')) return true;

        if (step === 2 && userRoles.includes('accounting head')) return true;
        if (step === 3 && userRoles.includes('auditor')) return true;
        if (step === 4 && userRoles.includes('SVP')) return true;

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

        const opt = {
            margin: 0,
            filename: `Voucher_${disbursement?.control_number}.pdf`,
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
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt as any).save().catch((err: any) => {
            console.error('PDF Generation failed:', err);
            alert('Failed to generate PDF. Please try using the browser print function (Ctrl+P).');
        });
    };

    const RejectionNotice = () => {
        if (disbursement?.status !== 'rejected') return null;

        const rejectionTracking = disbursement.tracking
            ?.filter(t => t.action === 'rejected' && t.acted_at)
            .sort((a, b) => new Date(b.acted_at!).getTime() - new Date(a.acted_at!).getTime())[0];

        if (!rejectionTracking) return null;

        return (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive mb-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                <XCircle className="h-5 w-5" />
                <div className="ml-2">
                    <AlertTitle className="font-bold text-lg mb-1 flex items-center gap-2">
                        Disbursement Rejected
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-3">
                        <div className="bg-destructive/5 p-3 rounded-md border border-destructive/10">
                            <p className="font-semibold text-sm">Reason:</p>
                            <p className="text-sm italic opacity-90 mt-1">"{rejectionTracking.remarks}"</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
                            <span className="bg-destructive/20 px-2 py-0.5 rounded">Rejected by {rejectionTracking.role}</span>
                            <span>•</span>
                            <span>{formatDate(rejectionTracking.acted_at ?? undefined)}</span>
                        </div>
                    </AlertDescription>
                </div>
            </Alert>
        );
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading Disbursement..." />
                <div className="flex h-[400px] items-center justify-center">
                    <div className="text-muted-foreground animate-pulse text-lg">Loading disbursement details...</div>
                </div>
            </AppLayout>
        );
    }

    if (!disbursement) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Disbursement Not Found" />
                <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                    <h2 className="text-2xl font-bold">Disbursement Not Found</h2>
                    <Button asChild>
                        <Link href={route('disbursements')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Disbursements
                        </Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Disbursement - ${disbursement.control_number}`} />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={route('disbursements')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{disbursement.control_number}</h2>
                            <p className="text-muted-foreground">Detailed check voucher view for this disbursement.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="text-sm px-3 py-1" variant={getStatusBadgeVariant(disbursement.status)}>
                            {disbursement.status?.toUpperCase()}
                        </Badge>
                        {disbursement.status === 'approved' && (
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
                                    Disbursement Info
                                </CardTitle>
                                <p className='ml-7 -mt-1 text-sm opacity-60'>Record of approved fund disbursements</p>
                            </CardHeader>
                            <DottedSeparator />
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-10 pb-1">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        Title
                                    </p>
                                    <p className="text-sm ml-5 font-semibold text-primary overflow-hidden text-ellipsis whitespace-nowrap">{disbursement.title}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        Date Created
                                    </p>
                                    <p className="text-sm ml-5 font-semibold">{formatDate(disbursement.created_at)}</p>
                                </div>
                                <div className="sm:col-span-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                        <Info className="h-3 w-3" />
                                        Description
                                    </p>
                                    <p className="text-sm ml-5 text-foreground">
                                        {disbursement.description || 'No description provided.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Voucher - Paper A4 Look */}
                        <div className="overflow-x-auto pb-4 flex justify-center bg-gray-100/50 rounded-xl border p-2 sm:p-4">
                            <div className="w-full max-w-[210mm] min-w-0">
                                <VoucherTemplate disbursement={disbursement} />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="sticky top-6">
                        <DisbursementSidebar
                            currentStep={disbursement.step}
                            tracking={disbursement.tracking}
                            attachments={disbursement.attachments}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Action Buttons */}
            {canPerformAction() && (
                <div className="fixed bottom-8 right-8 flex items-center gap-3 z-50 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Button
                        variant="outline"
                        onClick={() => handleAction('decline')}
                        disabled={isActionLoading}
                        className="h-12 px-6 rounded-full border-destructive text-destructive hover:bg-destructive/5 shadow-lg bg-white font-semibold"
                    >
                        {isActionLoading ? 'Processing...' : 'Decline'}
                    </Button>
                    <Button
                        onClick={() => handleAction('approve')}
                        disabled={isActionLoading}
                        className="h-12 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-xl font-semibold scale-105 transition-transform hover:scale-110 active:scale-95"
                    >
                        {isActionLoading ? 'Processing...' : 'Approve Disbursement'}
                    </Button>
                </div>
            )}

            {/* Decline Reason Modal */}
            <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Decline Disbursement
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for declining this disbursement. This will be sent as a notification to the person who generated it.
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
        </AppLayout>
    );
}
