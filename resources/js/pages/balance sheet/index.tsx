import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Balance Sheet',
        href: route('balance-sheet.index'),
    },
];
export default function BalanceSheet() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Balance Sheet" />
        </AppLayout>
    );
}