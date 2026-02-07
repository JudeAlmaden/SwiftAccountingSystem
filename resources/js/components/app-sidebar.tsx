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
import { LayoutGrid, User, FileText, WalletCards, BookOpen, Bell, BarChart3, PieChart, Tag, ClipboardList } from 'lucide-react';
import AppLogo from './app-logo';
import type { SharedData } from '@/types';
import { route } from 'ziggy-js';

export function AppSidebar() {
    const { user } = usePage<SharedData>().props;
    /* ======================
    NAV CONFIG PER PERMISSION
    ====================== */
    const navItemDetails: Record<string, NavItem & { permission?: string; role?: string }> = {
        dashboard: { title: 'Dashboard', href: route('dashboard'), icon: LayoutGrid },
        users: { title: 'Users and Accounts', href: route('users'), icon: User, permission: 'view users' },
        disbursements: { title: 'Disbursement', href: route('disbursements'), icon: WalletCards, permission: 'view disbursements' },
        disbursementReports: { title: 'Disbursement Reports', href: route('reports.disbursements'), icon: BarChart3, permission: 'view disbursements' },
        chartAccounts: { title: 'Chart of Accounts', href: route('accounts'), icon: BookOpen, permission: 'view accounts' },
        accountReports: { title: 'Account Reports', href: route('reports.accounts'), icon: PieChart, permission: 'view accounts' },
        controlPrefixes: { title: 'Control number prefixes', href: route('control-number-prefixes.index'), icon: Tag, permission: 'manage control number prefixes', role: 'accounting head' },
        auditTrails: { title: 'Audit Trails', href: route('audit-trails.index'), icon: ClipboardList, permission: 'view audit trails' },
        notifications: { title: 'Notifications', href: route('inbox'), icon: Bell },
    };

    const userPermissions = user?.permissions || [];
    const userRoles = (user?.roles as string[] | undefined) || [];

    // Filter items based on permissions or role
    const navItems = Object.values(navItemDetails).filter(item => {
        if (!item.permission && !item.role) return true;
        if (item.permission && userPermissions.includes(item.permission)) return true;
        if (item.role && userRoles.includes(item.role)) return true;
        return false;
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
