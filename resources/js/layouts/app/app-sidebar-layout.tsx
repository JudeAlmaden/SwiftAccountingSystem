import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps, SharedData } from '@/types';
import { Toaster, toast } from 'sonner';
import { usePage, router } from '@inertiajs/react';
import { ExternalLink, X } from 'lucide-react';
import { route } from 'ziggy-js';
import { useEffect, useRef } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { user } = usePage<SharedData>().props;
    const lastNotificationIdRef = useRef<number | null>(null);

    const handleViewNotification = async (notificationId: number, link: string) => {
        try {
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const csrfToken = meta?.content || '';
            
            await fetch(route('notifications.mark-read', { id: notificationId }), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
            });
            
         
            router.reload({ only: ['user'] });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
        router.visit(link);
    };

    useEffect(() => {
        if (!user) return;

        const checkForNewNotifications = async () => {
            try {
                const response = await fetch('/api/notifications', {
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                const data = await response.json();
                
                if (data.notifications && data.notifications.length > 0) {
                    const latestNotification = data.notifications[0];        
                    if (lastNotificationIdRef.current !== null && 
                        latestNotification.id !== lastNotificationIdRef.current &&
                        !latestNotification.is_read) {
                        toast.custom(
                            (t) => (
                                <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-lg shadow-lg p-4 relative">
                                    <button
                                        onClick={() => toast.dismiss(t)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    
                                    <div className="pr-6">
                                        <h3 className="font-bold text-sm text-gray-900 mb-1">
                                            {latestNotification.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            {latestNotification.message}
                                        </p>
                                        
                                        {latestNotification.link && (
                                            <button
                                                onClick={() => {
                                                    handleViewNotification(latestNotification.id, latestNotification.link);
                                                    toast.dismiss(t);
                                                }}
                                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                <span>View notification</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ),
                            {
                                duration: Infinity,
                            }
                        );
                        router.reload({ only: ['user'] });
                    }
                    lastNotificationIdRef.current = latestNotification.id;
                }
            } catch (error) {
                console.error('Error checking notifications:', error);
            }
        };
        checkForNewNotifications();
        const interval = setInterval(checkForNewNotifications, 5000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <AppShell variant="sidebar">
            <Toaster position="bottom-right" expand={true} richColors />
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


