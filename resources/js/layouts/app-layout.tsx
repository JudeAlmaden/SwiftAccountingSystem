import { Head, usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import type { SharedData } from '@/types';


export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { user, csrf_token } = usePage<SharedData>().props;
    return (
        <AppLayoutTemplate
            breadcrumbs={breadcrumbs}
            {...props}
            user={user}
        >
            <Head>
                <meta name="csrf-token" content={csrf_token} />
            </Head>
            {children}
        </AppLayoutTemplate>
    );
};