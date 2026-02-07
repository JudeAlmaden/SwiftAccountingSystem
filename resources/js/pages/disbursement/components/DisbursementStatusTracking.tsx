import { DottedSeparator } from '@/components/dotted-line';
import { Card } from '@/components/ui/card';
import { DisbursementTracking, StepFlowStep } from '@/types/database';
import { useState } from 'react';

const ROLE_LABELS: Record<string, string> = {
    'accounting assistant': 'Accounting Assistant',
    'accounting head': 'Accounting Head',
    'auditor': 'Auditor',
    'svp': 'SVP',
};

function stepLabel(stepFlow: StepFlowStep[] | null | undefined, index: number): string {
    if (stepFlow && stepFlow[index]) {
        const role = stepFlow[index].role;
        if (role) return ROLE_LABELS[role.toLowerCase()] ?? role;
        return 'Prepared by';
    }
    return ['Accounting Assistant', 'Accounting Head', 'Auditor', 'SVP'][index] ?? `Step ${index + 1}`;
}

interface StatusTrackingProps {
    currentStep?: number;
    stepFlow?: StepFlowStep[] | null;
    tracking?: DisbursementTracking[];
}

export function DisbursementStatusTracking({ currentStep = 1, stepFlow, tracking = [] }: StatusTrackingProps) {
    const [expandedRemarks, setExpandedRemarks] = useState<number[]>([]);
    const steps = Array.from({ length: 4 }, (_, i) => ({
        name: stepLabel(stepFlow, i),
        role: (stepFlow && stepFlow[i]?.role) || (i === 0 ? 'accounting assistant' : ['accounting head', 'auditor', 'svp'][i - 1]),
    }));

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-header">Approval Workflow</h3>
                <p className="text-xs text-[#737385]">Current progress and history</p>
            </div>

            <DottedSeparator className='-mt-2 mb-6' />

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-1 bottom-1 w-[2px] bg-muted"></div>

                <div className="space-y-6">
                    {steps.map((step, index) => {
                        const stepNum = index + 1;
                        const trackingInfo = tracking.find(t => t.step === stepNum);
                        const isCompleted = trackingInfo?.action === 'approved';
                        const isPending = currentStep === stepNum && (!trackingInfo || trackingInfo.action === 'pending');
                        const isRejected = trackingInfo?.action === 'rejected';
                        const isFuture = currentStep < stepNum;
                        const actorName = trackingInfo?.handler?.name ?? (stepFlow?.[index]?.user_name ?? null);

                        let circleClass = 'bg-muted border-muted';
                        let textColor = 'text-muted-foreground';
                        let statusText = 'Pending';
                        let icon = null;

                        if (isCompleted) {
                            circleClass = 'bg-green-500 border-green-500 shadow-green-100 shadow-lg';
                            textColor = 'text-foreground';
                            statusText = actorName || 'Approved';
                            icon = (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            );
                        } else if (isRejected) {
                            circleClass = 'bg-destructive border-destructive shadow-destructive/20 shadow-lg';
                            textColor = 'text-destructive';
                            statusText = `Rejected by ${actorName || 'System'}`;
                            icon = (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            );
                        } else if (isPending) {
                            circleClass = 'bg-white border-primary border-2 shadow-primary/20 shadow-lg';
                            textColor = 'text-foreground';
                            statusText = 'Waiting for Action';
                            icon = <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>;
                        } else if (isFuture) {
                            circleClass = 'bg-muted/50 border-muted';
                            textColor = 'text-muted-foreground/50';
                            statusText = 'Next Step';
                            icon = null;
                        }

                        return (
                            <div key={step.role} className="flex items-start gap-4 relative">
                                <div className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full z-10 border transition-all duration-300 ${circleClass}`}>
                                    {isPending && (
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                                    )}
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm font-bold tracking-tight ${textColor}`}>
                                            {step.name}
                                        </p>
                                        {trackingInfo?.acted_at && (
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 font-medium">
                                                {formatDate(trackingInfo.acted_at)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-[11px] font-medium truncate ${isCompleted ? 'text-green-600' : isRejected ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        {statusText}
                                    </p>

                                    {trackingInfo?.remarks && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => {
                                                    setExpandedRemarks(prev =>
                                                        prev.includes(stepNum)
                                                            ? prev.filter(s => s !== stepNum)
                                                            : [...prev, stepNum]
                                                    );
                                                }}
                                                className="flex items-center gap-1.5 text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors bg-primary/5 px-2 py-0.5 rounded-full"
                                            >
                                                <svg
                                                    className={`h-3 w-3 transition-transform duration-200 ${expandedRemarks.includes(stepNum) ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                                <span>View Remarks</span>
                                            </button>
                                            {expandedRemarks.includes(stepNum) && (
                                                <p className="text-[11px] text-foreground/80 italic mt-2 bg-muted/30 p-2 rounded-md border-l-2 border-primary/30 leading-relaxed shadow-sm">
                                                    "{trackingInfo.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
