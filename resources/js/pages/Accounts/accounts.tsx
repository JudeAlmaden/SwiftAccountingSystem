import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import AccountsTab from './tabs/AccountsTab';
import GroupsTab from './tabs/GroupsTab';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Chart of Accounts',
        href: route('accounts'),
    },
];

export default function ChartOfAccounts() {
    // Group State
    const [view, setView] = useState<'accounts' | 'groups'>('accounts');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chart of Accounts" />
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl text-header">Chart of Accounts</h2>
                        <p className="text-muted-foreground">Manage your financial accounts and structure.</p>
                    </div>
                </div>

                <div className="flex border-b">
                    <button
                        className={`px-4 py-2 font-medium text-sm ${view === 'accounts' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setView('accounts')}
                    >
                        Accounts
                    </button>
                    <button
                        className={`px-4 py-2 font-medium text-sm ${view === 'groups' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setView('groups')}
                    >
                        Account Groups
                    </button>
                </div>

                {view === 'groups' && <GroupsTab />}
                {view === 'accounts' && <AccountsTab />}
            </div>
        </AppLayout>
    );
}
