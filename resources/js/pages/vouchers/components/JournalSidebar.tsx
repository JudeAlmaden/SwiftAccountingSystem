import type { JournalTracking, JournalAttachment as DBAttachment, StepFlowStep } from '@/types/database';
import { JournalAttachment } from './JournalAttachment';
import { JournalStatusTracking } from './JournalStatusTracking';

interface JournalSidebarProps {
    currentStep?: number;
    stepFlow?: StepFlowStep[] | null;
    tracking?: JournalTracking[];
    attachments?: DBAttachment[];
}

export function JournalSidebar({ currentStep, stepFlow, tracking, attachments = [] }: JournalSidebarProps) {
    return (
        <div className="flex flex-col gap-6">
            <JournalStatusTracking currentStep={currentStep} stepFlow={stepFlow} tracking={tracking} />
            <JournalAttachment attachments={attachments} mode="view" />
        </div>
    );
}
