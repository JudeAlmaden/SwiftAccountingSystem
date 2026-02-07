import { route } from 'ziggy-js';
import { dashboard } from '@/routes';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { User, Role, Permission } from '@/types/database';
import type { BreadcrumbItem } from '@/types';

interface SharedData {
    auth: {
        user: User;
    };
    roles: Role[];
    permissions: Permission[];
    [key: string]: any;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Shield, Briefcase, FileText, Search } from 'lucide-react';
import { SpecialUserCard } from './components/special-user-card';
import { UserFormModal } from './components/user-form-modal';
import { UserStats } from './components/user-stats';
import { StatusIndicator } from '@/components/status-indicator';

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

    const { user: currentUser, roles, permissions, stats: initialStats, specialUsers: initialSpecialUsers, initialUsers } = usePage<SharedData>().props;

    const userRoles = currentUser?.roles || [];
    const userPermissions = currentUser?.permissions || [];
    
    const isAdmin = userRoles.includes('admin');
    const canCreateUsers = isAdmin || userPermissions.includes('create users');
    const canEditUsers = isAdmin || userPermissions.includes('edit users');

   
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const [users, setUsers] = useState<User[]>(initialUsers?.data || []);
    const [pagination, setPagination] = useState({
        current_page: initialUsers?.current_page || 1,
        last_page: initialUsers?.last_page || 1,
        next_page_url: initialUsers?.next_page_url || null,
        prev_page_url: initialUsers?.prev_page_url || null,
        total: initialUsers?.total || 0,
        from: initialUsers?.from || 0,
        to: initialUsers?.to || 0,
    });
    const [stats, setStats] = useState({
        total_users: initialStats?.total_users ?? 0,
        active_users: initialStats?.active_users ?? 0,
        inactive_users: initialStats?.inactive_users ?? 0,
        admin_users: initialStats?.admin_users ?? 0,
    });

    const [specialUsers, setSpecialUsers] = useState<{
        accounting_head: User[];
        svp: User[];
        auditor: User[];
    }>({
        accounting_head: initialSpecialUsers?.accounting_head ?? [],
        svp: initialSpecialUsers?.svp ?? [],
        auditor: initialSpecialUsers?.auditor ?? [],
    });

    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
        permissions: [] as string[],
    });
    const [formErrors, setFormErrors] = useState<any>({});

    const fetchUsers = (url?: string | null) => {
        setIsLoading(true);
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': token,
        };

        const targetUrl = new URL(url || route('users.index'));
        if (searchQuery) {
            targetUrl.searchParams.set('search', searchQuery);
        }

        Promise.all([
            fetch(targetUrl.toString(), { headers }).then(res => res.json()),
            fetch(route('users.stats'), { headers }).then(res => res.json())
        ]).then(([usersData, statsData]) => {
            // Handle Paginated Response
            setUsers(usersData.data || []);
            setPagination({
                current_page: usersData.current_page,
                last_page: usersData.last_page,
                next_page_url: usersData.next_page_url,
                prev_page_url: usersData.prev_page_url,
                total: usersData.total,
                from: usersData.from,
                to: usersData.to,
            });

            // Handle Stats & Special Users
            setStats(statsData);
            setSpecialUsers({
                accounting_head: statsData.special_users.accounting_head || [],
                svp: statsData.special_users.svp || [],
                auditor: statsData.special_users.auditor || [],
            });
            setIsLoading(false);
        }).catch(error => {
            console.error('Failed to fetch data:', error);
            setIsLoading(false);
        });
    };

    // Debounce Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(search);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Fetch on Search or initial load
    useEffect(() => {
        // Only fetch if there's a search query, otherwise use initial data
        if (searchQuery) {
            fetchUsers();
        } else {
            // Use initial load, just set loading to false
            setIsLoading(false);
        }
    }, [searchQuery]);


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
            permissions: [],
        });
        setFormErrors({});
        setAppModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setIsEditing(true);
        setCurrentUserId(user.id);
        const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : '';
        const userPermissions = user.permissions ? user.permissions.map(p => p.name) : [];

        setUserForm({
            id: user.id,
            name: user.name,
            account_number: user.account_number || '',
            email: user.email || '',
            role: userRole,
            status: user.status,
            password: '',
            password_confirmation: '',
            permissions: userPermissions,
        });
        setFormErrors({});
        setAppModalOpen(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFormErrors({});

        //Url changes for update and store
        const url = isEditing && currentUserId
            ? route('users.update', currentUserId)
            : route('users.store');

        //Method changes for update and store
        const method = isEditing ? 'PUT' : 'POST';

        //Fetch for update and store
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
            body: JSON.stringify(userForm),
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    if (res.status === 422) {
                        setFormErrors(data.errors || {});
                    } else {
                        alert(data.message || 'An error occurred.');
                    }
                    throw new Error('Validation failed');
                }
                console.log(data);
                return data;
            })
            .then(() => {
                setAppModalOpen(false);
                fetchUsers();
            })
            .catch(err => console.error(err))
            .finally(() => setIsSaving(false));
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
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium px-4">{user.name}</TableCell>
                                                <TableCell className="px-4 whitespace-nowrap">{user.account_number}</TableCell>
                                                <TableCell className="px-4">{user.email || <span className="text-muted-foreground italic">None</span>}</TableCell>
                                                <TableCell className="px-4">
                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                                                        {user.roles?.map((role) => role.name).join(', ') || 'No role'}
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
                                onClick={() => fetchUsers(pagination.prev_page_url)}
                                disabled={!pagination.prev_page_url}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchUsers(pagination.next_page_url)}
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
                    availablePermissions={permissions || []}
                />

            </div>
        </AppLayout>
    );
}
