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
        title: 'Income Entry',
        href: route('income-entry.index'),
    },
];
export default function IncomeEntry() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Income Entry" />
        </AppLayout>
    );
}