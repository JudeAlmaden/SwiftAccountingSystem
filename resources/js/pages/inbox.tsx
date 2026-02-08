import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCheck, ExternalLink, Inbox as InboxIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Inbox',
        href: '/inbox',
    },
];

interface Notification {
    id: number;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export default function Inbox() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Accept': 'application/json',
                }
            });
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: number, link: string | null) => {
        try {
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const token = meta?.content || '';

            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(data.unread_count);
            router.reload({ only: ['user'] });

            if (link) {
                setTimeout(() => router.visit(link), 100);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const token = meta?.content || '';

            const response = await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            router.reload({ only: ['user'] });
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <InboxIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
                            <p className="text-sm text-muted-foreground">Stay updated on your disbursement approval tasks.</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 text-xs font-semibold hover:border-primary hover:text-primary transition-all rounded-full px-4"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                        <Loader2 className="h-8 w-8 text-primary/50 animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Fetching your messages...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="border-2 border-dashed border-border/50 bg-muted/10">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <BellOff className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                You don't have any notifications at the moment. When someone approves a disbursement, you'll see it here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {notifications.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => markAsRead(item.id, item.link)}
                                className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-md ${!item.is_read
                                        ? 'bg-card border-primary/20 shadow-sm hover:border-primary/40 active:bg-primary/5'
                                        : 'bg-muted/10 border-border/50 hover:bg-muted/20'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 transition-all ${!item.is_read ? 'bg-primary scale-110 shadow-[0_0_8px_rgba(var(--primary),0.6)]' : 'bg-transparent'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4 mb-1">
                                            <h4 className={`text-sm font-bold truncate ${!item.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {item.message}
                                        </p>
                                        {item.link && (
                                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Disbursement <ExternalLink className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
