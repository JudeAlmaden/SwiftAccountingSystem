import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, User, FileText, WalletCards, BookOpen, Bell, BarChart3, PieChart, Tag, ClipboardList, Package } from 'lucide-react';
import { route } from 'ziggy-js';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import type { SharedData } from '@/types';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { user } = usePage<SharedData>().props;
    /* ======================
    NAV CONFIG PER PERMISSION
    ====================== */
    const navItemDetails: Record<string, NavItem & { permission?: string | string[] }> = {
        dashboard: { title: 'Dashboard', href: route('dashboard'), icon: LayoutGrid },
        inventory: { title: 'Inventory', href: route('inventory.index'), icon: Package, exact: false, permission: 'view inventory' },
        users: { title: 'Users and Accounts', href: route('users.index'), icon: User, permission: 'view users', exact: false },
        vouchers: { title: 'Vouchers', href: route('vouchers.index'), icon: WalletCards, permission: 'view journals', exact: false },
        vouchersReports: { title: 'Voucher Statistics', href: route('vouchers.statistics'), icon: BarChart3, permission: 'view journals' },
        chartAccounts: { title: 'Chart of Accounts', href: route('accounts.index'), icon: BookOpen, permission: 'view accounts', exact: false },
        accountReports: { title: 'Account Reports', href: route('accounts.reports'), icon: PieChart, permission: 'view accounts' },
        controlPrefixes: { title: 'Control number prefixes', href: route('control-number-prefixes.index'), icon: Tag, permission: 'manage control number prefixes' },
        auditTrails: { title: 'Audit Trails', href: route('audit-trails.index'), icon: ClipboardList, permission: 'view audit trails' },
        trialBalance: { title: 'Trial Balance', href: route('trial-balance.index'), icon: PieChart, permission: 'create trial balance' },
        incomeEntry: { title: 'Income Entry', href: route('income-entry.index'), icon: FileText, permission: 'create trial balance' },
        balanceSheet: { title: 'Balance Sheet', href: route('balance-sheet.index'), icon: BarChart3, permission: 'create trial balance' },
        notifications: { title: 'Notifications', href: route('inbox'), icon: Bell },
    };

    const userPermissions = (user?.permissions as string[] | undefined) || [];

    // Map counts to items
    if (navItemDetails.notifications) {
        navItemDetails.notifications.count = user?.unread_notifications_count as number;
    }
    if (navItemDetails.vouchers) {
        navItemDetails.vouchers.count = user?.pending_vouchers_count as number;
    }
    if (navItemDetails.incomeEntry) {
        navItemDetails.incomeEntry.count = user?.pending_income_entries_count as number;
    }

    // Filter items based on permission
    const navItems = Object.values(navItemDetails).filter((item) => {
        if (!item.permission) return true;
        const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
        return perms.some((p) => userPermissions.includes(p));
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
