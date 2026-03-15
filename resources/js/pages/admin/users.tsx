import { Head, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { StatusIndicator } from '@/components/status-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { User, Role } from '@/types/database';

interface SharedData {
    auth: {
        user: User;
    };
    roles: Role[];
    filters?: {
        search?: string;
        role?: string;
        email?: string;
        status?: string;
    };
    stats: any;
    specialUsers: any;
    initialUsers: any;
    [key: string]: any;
}
import { Shield, Briefcase, FileText, Search } from 'lucide-react';
import { SpecialUserCard } from './components/special-user-card';
import { UserFormModal } from './components/user-form-modal';
import { UserStats } from './components/user-stats';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'User Management',
        href: route('users.index'),
    }
];

export default function Users() {

    const { user: currentUser, roles, stats, specialUsers, initialUsers: paginatedUsers, filters = {} } = usePage<SharedData>().props;

    const userRoles = currentUser?.roles || [];
    const isAdmin = userRoles.includes('admin');
    const canCreateUsers = isAdmin;
    const canEditUsers = isAdmin;

    const users: User[] = paginatedUsers?.data || [];
    const pagination = {
        current_page: paginatedUsers?.current_page || 1,
        last_page: paginatedUsers?.last_page || 1,
        next_page_url: paginatedUsers?.next_page_url || null,
        prev_page_url: paginatedUsers?.prev_page_url || null,
        total: paginatedUsers?.total || 0,
        from: paginatedUsers?.from || 0,
        to: paginatedUsers?.to || 0,
    };

    const [search, setSearch] = useState(filters.search || '');
    const [isLoading, setIsLoading] = useState(false);

    const [isAppModalOpen, setAppModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [userForm, setUserForm] = useState({
        id: -1,
        name: '',
        account_number: '',
        email: '',
        role: '',
        status: 'active',
        password: '',
        password_confirmation: '',
    });
    const [formErrors, setFormErrors] = useState<any>({});

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters.search || '')) {
                setIsLoading(true);
                router.get(route('users.index'), { ...filters, search }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setIsLoading(false)
                });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);


    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentUserId(null);
        setUserForm({
            id: -1,
            name: '',
            account_number: '',
            email: '',
            role: '',
            status: 'active',
            password: '',
            password_confirmation: '',
        });
        setFormErrors({});
        setAppModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setIsEditing(true);
        setCurrentUserId(user.id);
        const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : '';

        setUserForm({
            id: user.id,
            name: user.name,
            account_number: user.account_number || '',
            email: user.email || '',
            role: userRole,
            status: user.status,
            password: '',
            password_confirmation: '',
        });
        setFormErrors({});
        setAppModalOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFormErrors({});

        const url = isEditing && currentUserId
            ? route('users.update', currentUserId)
            : route('users.store');

        const method = isEditing ? 'put' : 'post';

        router[method](url, userForm, {
            preserveScroll: true,
            onSuccess: () => {
                setAppModalOpen(false);
            },
            onError: (errors) => {
                setFormErrors(errors);
            },
            onFinish: () => setIsSaving(false),
        });
    };


    //UI Element
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users & Accounts" />
            <div className="flex flex-col gap-6">

                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl text-header">Users and Accounts</h1>
                    <p className="text-muted-foreground">Manage user accounts, roles, and permissions here</p>
                </div>


                <UserStats stats={stats} />

                <div className="flex flex-col gap-1 py-2">
                    <h2 className="text-2xl text-header">Special Users</h2>
                    <p className="text-sm text-[#737385]">Users with special roles and permissions</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <SpecialUserCard
                        title="Accounting Head"
                        icon={Briefcase}
                        users={specialUsers.accounting_head}
                        onEdit={openEditModal}
                        onAssign={() => openCreateModal()}
                    />
                    <SpecialUserCard
                        title="SVP"
                        icon={Shield}
                        users={specialUsers.svp}
                        onEdit={openEditModal}
                        onAssign={() => openCreateModal()}
                    />
                    <SpecialUserCard
                        title="Auditor"
                        icon={FileText}
                        users={specialUsers.auditor}
                        onEdit={openEditModal}
                        onAssign={() => openCreateModal()}
                    />
                </div>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl text-header">User Accounts</h2>
                            <p className="text-sm text-[#737385]">View and manage all registered users</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4 relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-lg border-gray-300 border-[1.7px] rounded-sm bg-white pl-9"
                        />
                        {canCreateUsers && (
                            <Button onClick={openCreateModal} variant="default">Add User</Button>
                        )}
                    </div>

                    <Card className="overflow-hidden rounded-sm py-0 pb-6">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="border-0">
                                    <TableRow className="bg-table-head hover:bg-table-head border-0">
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head first:rounded-tl-sm">Name</TableHead>
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Employee Number</TableHead>
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Email</TableHead>
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Role</TableHead>
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head">Status</TableHead>
                                        <TableHead className="px-4 py-5 text-white text-base font-extrabold bg-table-head last:rounded-tr-sm">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                {isLoading ? 'Loading...' : 'No users found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user: User) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium px-4">{user.name}</TableCell>
                                                <TableCell className="px-4 whitespace-nowrap">{user.account_number}</TableCell>
                                                <TableCell className="px-4">{user.email || <span className="text-muted-foreground italic">None</span>}</TableCell>
                                                <TableCell className="px-4">
                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                                                        {user.roles?.map((role: Role) => role.name).join(', ') || 'No role'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    <StatusIndicator status={user.status as 'active' | 'inactive'} />
                                                </TableCell>
                                                <TableCell className="px-4">
                                                    {canEditUsers ? (
                                                        <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>Edit</Button>
                                                    ) : (
                                                        <Button variant="outline" size="sm" disabled>Edit</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {pagination.from} to {pagination.to} of {pagination.total} entries
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (pagination.prev_page_url) {
                                        router.get(pagination.prev_page_url, {}, { preserveScroll: true, preserveState: true });
                                    }
                                }}
                                disabled={!pagination.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (pagination.next_page_url) {
                                        router.get(pagination.next_page_url, {}, { preserveScroll: true, preserveState: true });
                                    }
                                }}
                                disabled={!pagination.next_page_url}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>

                {/* User Modal */}
                <UserFormModal
                    isOpen={isAppModalOpen}
                    onOpenChange={setAppModalOpen}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    currentUserId={currentUserId}
                    currentUser={currentUser}
                    userForm={userForm}
                    formErrors={formErrors}
                    onSubmit={handleSaveUser}
                    onFormChange={(field, value) => setUserForm({ ...userForm, [field]: value })}
                    availableRoles={roles || []}
                />

            </div>
        </AppLayout>
    );
}
