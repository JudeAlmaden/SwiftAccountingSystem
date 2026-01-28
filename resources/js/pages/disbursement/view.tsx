import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Disbursement } from '@/types/database';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard')
    }, {
        title: 'Disbursements',
        href: route('disbursements')
    }
];

export default function View() {
    // Get CSRF token
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';
    const { id } = usePage().props;

    const [disbursement, setDisbursement] = useState<Disbursement>({} as Disbursement);

    const fetchData = async () => {
        try {
            const res = await fetch(route('disbursements.show', { id }), {
                headers: {
                    Accept: 'application/json',
                },
            });

            const { disbursement } = await res.json();
            setDisbursement(disbursement);
            console.log(disbursement);
        } catch (err) {
            console.error('Failed to fetch disbursement', err);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            View something
        </AppLayout>
    );
}
