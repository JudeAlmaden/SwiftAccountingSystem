import { DisbursementAttachment } from './DisbursementAttachment';
import { DisbursementStatusTracking } from './DisbursementStatusTracking';
import { DisbursementTracking, DisbursementAttachment as DBAttachment, StepFlowStep } from '@/types/database';

interface DisbursementSidebarProps {
    currentStep?: number;
    stepFlow?: StepFlowStep[] | null;
    tracking?: DisbursementTracking[];
    attachments?: DBAttachment[];
}

export function DisbursementSidebar({ currentStep, stepFlow, tracking, attachments = [] }: DisbursementSidebarProps) {
    return (
        <div className="flex flex-col gap-6">
            <DisbursementStatusTracking currentStep={currentStep} stepFlow={stepFlow} tracking={tracking} />
            <DisbursementAttachment attachments={attachments} mode="view" />
        </div>
    );
}
