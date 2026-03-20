import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, User, FileText, WalletCards, BookOpen, Bell, BarChart3, PieChart, Tag, ClipboardList } from 'lucide-react';
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
    const navItemDetails: Record<string, NavItem & { role?: string | string[] }> = {
        dashboard: { title: 'Dashboard', href: route('dashboard'), icon: LayoutGrid },
        users: { title: 'Users and Accounts', href: route('users.index'), icon: User, role: 'admin', exact: false },
        vouchers: { title: 'Vouchers', href: route('vouchers.index'), icon: WalletCards, role: ['accounting head', 'accounting assistant', 'auditor', 'SVP'], exact: false },
        vouchersReports: { title: 'Voucher Statistics', href: route('vouchers.statistics'), icon: BarChart3, role: ['accounting head', 'accounting assistant', 'auditor', 'SVP'] },
        chartAccounts: { title: 'Chart of Accounts', href: route('accounts.index'), icon: BookOpen, role: ['accounting head', 'accounting assistant', 'auditor', 'SVP'], exact: false },
        accountReports: { title: 'Account Reports', href: route('accounts.reports'), icon: PieChart, role: ['accounting head', 'accounting assistant', 'auditor', 'SVP'] },
        controlPrefixes: { title: 'Control number prefixes', href: route('control-number-prefixes.index'), icon: Tag, role: 'accounting head' },
        auditTrails: { title: 'Audit Trails', href: route('audit-trails.index'), icon: ClipboardList, role: ['admin', 'auditor'] },
        trialBalance: { title: 'Trial Balance', href: route('trial-balance.index'), icon: PieChart, role: ['accounting head', 'auditor'] },
        incomeEntry: { title: 'Income Entry', href: route('income-entry.index'), icon: FileText, role: ['accounting head', 'auditor'] },
        balanceSheet: { title: 'Balance Sheet', href: route('balance-sheet.index'), icon: BarChart3, role: ['accounting head', 'auditor'] },
        notifications: { title: 'Notifications', href: route('inbox'), icon: Bell },
    };

    const userRoles = (user?.roles as string[] | undefined) || [];

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

    // Filter items based on role
    const navItems = Object.values(navItemDetails).filter((item) => {
        if (!item.role) return true;
        const roles = Array.isArray(item.role) ? item.role : [item.role];
        return roles.some((r) => userRoles.includes(r));
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
