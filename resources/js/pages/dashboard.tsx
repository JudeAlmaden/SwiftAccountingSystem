import { Head, Link } from '@inertiajs/react';
import {
    FileText,
    Users,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    Banknote,
} from 'lucide-react';
import { route } from 'ziggy-js';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export interface DashboardStats {
    disbursements: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        total_approved_amount: number;
    };
    users: {
        total: number;
        active: number;
    };
    accounts: {
        total: number;
        active: number;
    };
}

interface DashboardProps {
    stats: DashboardStats;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function Dashboard({ stats }: DashboardProps) {
    const { disbursements, users, accounts } = stats;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Overview and aggregated report
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Vouchers
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {disbursements.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pending: {disbursements.pending} · Approved:{' '}
                                {disbursements.approved} · Rejected:{' '}
                                {disbursements.rejected}
                            </p>
                            <Link
                                href={route('vouchers')}
                                className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                            >
                                View all →
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Approved
                            </CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(disbursements.total_approved_amount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sum of approved voucher credits
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {users.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {users.active} active
                            </p>
                            <Link
                                href={route('users')}
                                className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                            >
                                Manage users →
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Chart of Accounts
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {accounts.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {accounts.active} active accounts
                            </p>
                            <Link
                                href={route('accounts')}
                                className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
                            >
                                View chart →
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Simple report summary */}
                <Card>
                        <CardHeader>
                            <CardTitle>Summary report</CardTitle>
                            <CardDescription>
                                Voucher status breakdown and key counts
                            </CardDescription>
                        </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                <Clock className="h-8 w-8 text-amber-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Pending
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {disbursements.pending}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Approved
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {disbursements.approved}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                <XCircle className="h-8 w-8 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Rejected
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {disbursements.rejected}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border p-4">
                                <Banknote className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Approved amount
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {formatCurrency(
                                            disbursements.total_approved_amount
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
