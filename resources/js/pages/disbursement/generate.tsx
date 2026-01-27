import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Disbursements',
        href: route('disbursements'),
    },
];



export default function Generate() {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disbursements" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h1 className="text-2xl font-bold mb-4">Disbursements</h1>
                            <p className="text-gray-600">Manage your disbursements here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
