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
    const { isCurrentUrl, currentUrl } = useCurrentUrl();

    const getPath = (href: any) => {
        const url = typeof href === 'string' ? href : href.url;
        try {
            return new URL(url, window.location.origin).pathname;
        } catch {
            return url;
        }
    };

    // Determine the "Best Match" item among all items
    const activeItem = items.reduce((best, item) => {
        const targetPath = getPath(item.href);
        const isMatch = item.exact === false
            ? currentUrl.startsWith(targetPath)
            : currentUrl === targetPath;

        if (isMatch) {
            if (!best || targetPath.length > getPath(best.href).length) {
                return item;
            }
        }
        return best;
    }, null as NavItem | null);

    const notificationItem = items.find(item => item.title === 'Notifications');
    const platformItems = items.filter(item => item.title !== 'Notifications');

    const Badge = ({ count, isDot = false }: { count?: number; isDot?: boolean }) => {
        if (!count || count <= 0) return null;

        if (isDot) {
            return (
                <span className="absolute top-1 left-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white shadow-sm"></span>
                </span>
            );
        }

        return (
            <span className="flex h-5 w-auto min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {count}
            </span>
        );
    };

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
                                className={`relative flex items-center gap-2 rounded-sm px-0.5 py-0.5 transition-colors group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center ${activeItem?.title === notificationItem.title ? 'bg-[#16c42d]' : 'bg-[#d5e6d7] hover:bg-[#c5d6c7]'}`}
                            >
                                <div className="flex items-center justify-center w-10 h-10 bg-[#16c42d] rounded-sm shrink-0">
                                    {notificationItem.icon && <notificationItem.icon className="w-5 h-5 text-white" />}
                                </div>
                                <span className={`text-sm font-medium group-data-[collapsible=icon]:hidden ${activeItem?.title === notificationItem.title ? 'text-white' : 'text-[#02310b]'}`}>{notificationItem.title}</span>
                                <Badge count={notificationItem.count} isDot />
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
                                isActive={activeItem?.title === item.title}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch className="relative flex items-center gap-2">
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <Badge count={item.count} />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}
