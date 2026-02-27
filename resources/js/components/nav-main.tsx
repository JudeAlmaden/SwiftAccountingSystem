import { Link, usePage } from '@inertiajs/react';
import { DottedSeparator } from '@/components/dotted-line';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { user } = usePage<any>().props;
    const unreadCount = user?.unread_notifications_count || 0;

    const notificationItem = items.find(item => item.title === 'Notifications');
    const platformItems = items.filter(item => item.title !== 'Notifications');

    return (
        <>
         <DottedSeparator />
            {notificationItem && (
                <SidebarGroup className="px-2">
                    <SidebarMenu className="gap-3">
                        <SidebarMenuItem>
                            <Link 
                                href={notificationItem.href} 
                                prefetch 
                                className="relative flex items-center gap-2 rounded-sm px-0.5 py-0.5 bg-[#d5e6d7] hover:bg-[#c5d6c7] transition-colors group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                            >
                                <div className="flex items-center justify-center w-10 h-10 bg-[#16c42d] rounded-sm shrink-0">
                                    {notificationItem.icon && <notificationItem.icon className="w-5 h-5 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-[#02310b] group-data-[collapsible=icon]:hidden">{notificationItem.title}</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 left-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white shadow-sm"></span>
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            )}
            <DottedSeparator />
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu className="gap-3">
                    {platformItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch className="relative">
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}
