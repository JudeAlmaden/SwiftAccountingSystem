import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps, SharedData } from '@/types';
import { Toaster, toast } from 'sonner';
import { useEcho } from '@laravel/echo-react';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { user } = usePage<SharedData>().props;

    //Disable this for now since this thingb is buggy
    // useEcho(
    //     user ? `App.Models.User.${user.id}` : '',
    //     '.notification.created',
    //     (e: any) => {
    //         console.log('[Echo] ✓ Notification event received:', e);
    //         if (e.notification) {
    //             console.log('[Echo] ✓ Showing toast for:', e.notification.title);
    //             toast(e.notification.title, {
    //                 description: e.notification.message,
    //             });
    //         } else {
    //             console.warn('[Echo] ✗ No notification data in event:', e);
    //         }
    //     },
    //     [user?.id],
    //     'private'
    // );


    return (
        <AppShell variant="sidebar">
            <Toaster position="top-right" expand={true} richColors />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-visible bg-default-white px-16">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="pt-8">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}


