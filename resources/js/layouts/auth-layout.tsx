import { Head, usePage } from '@inertiajs/react';
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
import type { SharedData } from '@/types';


export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    const { csrf_token } = usePage<SharedData>().props;

    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            <Head>
                <meta name="csrf-token" content={csrf_token} />
            </Head>
            {children}
        </AuthLayoutTemplate>
    );
}
