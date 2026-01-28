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

// Keeping Account alias for backward compatibility if needed, but User seems more appropriate given fields. 
// However, to fix the lint error quickly without touching other files, I should probably check what 'users.tsx' imports.
// If 'users.tsx' imports 'Account', I should keep 'Account' or export 'Account' as 'User'.

export interface Role {
    id: number;
    name: string;
}
