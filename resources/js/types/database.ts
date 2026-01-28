export interface User {
    id: number;
    name: string;
    email: string;
    roles: Role[];
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
}

//Used in view
export interface Disbursement {
    id: number;
    control_number?: string;
    title?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    total_amount?: number;
    items?: Account[];
}

export interface Role {
    id: number;
    name: string;
}
