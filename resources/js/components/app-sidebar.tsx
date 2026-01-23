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
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, User, FileText, ShieldCheck } from 'lucide-react';
import AppLogo from './app-logo';
import type { SharedData } from '@/types';
import { route } from 'ziggy-js';

export function AppSidebar() {
    const { user } = usePage<SharedData>().props;
    /* ======================
    NAV CONFIG PER ROLE
    ====================== */
    const navItemsByRole: Record<string, string[]> = {
        'admin': ['dashboard', 'users'],
        'accounting assistant': ['dashboard', 'vouchers'],
        'accounting head': ['dashboard', 'chartAccounts', 'toReview'],
        'auditor': ['dashboard', 'toReview'],
        'SVP': ['dashboard'],
    };

    const navItemDetails: Record<string, NavItem> = {
        dashboard: { title: 'Dashboard', href: route('dashboard'), icon: LayoutGrid },
        users: { title: 'Users and Accounts', href: route('accounts'), icon: User },
        vouchers: { title: 'Generate Check Vouchers', href: '', icon: FileText },
        chartAccounts: { title: 'Chart of Accounts', href: '', icon: FileText },
        toReview: { title: 'To Review', href: '', icon: ShieldCheck },
    };

    const navItems = user?.roles
        .map(role => navItemsByRole[role] || [])
        .flat()
        .map(key => navItemDetails[key])
        .filter(Boolean);

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
