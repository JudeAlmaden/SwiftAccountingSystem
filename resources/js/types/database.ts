export interface User {
    id: number;
    name: string;
    account_number: string;
    email?: string;
    roles: Role[];
    permissions?: Permission[];
    status: string;
}

export interface Account {
    id: number;
    account_name: string;
    account_description: string;
    account_code: string;
    account_type: string;
    account_normal_side: string;
    status: string;
    disbursement_items_count?: number;
}

export interface DisbursementItem {
    id: number;
    disbursement_id: number;
    account_id: number;
    type: 'debit' | 'credit';
    amount: number;
    order_number: number;
    account?: Account;
}

export interface DisbursementTracking {
    id: number;
    disbursement_id: number;
    handled_by: number | null;
    step: number;
    role: 'accounting assistant' | 'accounting head' | 'auditor' | 'svp';
    action: 'pending' | 'approved' | 'rejected';
    remarks: string | null;
    acted_at: string | null;
    handler?: User;
}

export interface DisbursementAttachment {
    id: number;
    disbursement_id: number;
    file_path: string;
    file_name: string;
    file_type: string;
    created_at?: string;
}

/** One step in the approval flow. user_id: optional; when set, only that user (or admin) can act at this step. */
export interface StepFlowStep {
    user_id: number | null;
    role: string | null;
    /** When user_id is set, resolved by API for display. */
    user_name?: string | null;
}

//Used in view
export interface Disbursement {
    id: number;
    control_number?: string;
    title?: string;
    description?: string;
    status?: string;
    step_flow?: StepFlowStep[];
    current_step?: number;
    recommended_by?: string;
    created_at?: string;
    updated_at?: string;
    total_amount?: number;
    items?: DisbursementItem[];
    tracking?: DisbursementTracking[];
    attachments?: DisbursementAttachment[];
}

export interface Role {
    id: number;
    name: string;
    permissions?: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
}
