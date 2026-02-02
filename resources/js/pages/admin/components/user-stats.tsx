interface UserStatsProps {
    stats: {
        total_users: number;
        active_users: number;
        inactive_users: number;
        admin_users: number;
    };
}

export function UserStats({ stats }: UserStatsProps) {
    return (
        <div className="relative flex items-center justify-between border-[1.6px] bg-white border-gray-300 rounded-md py-8 px-6">
            <div className="absolute inset-y-0 left-1/4 w-0.5 border-l-2 border-dashed border-gray-400 opacity-60"></div>
            <div className="absolute inset-y-0 left-2/4 w-0.5 border-l-2 border-dashed border-gray-400 opacity-60"></div>
            <div className="absolute inset-y-0 left-3/4 w-0.5 border-l-2 border-dashed border-gray-400 opacity-60"></div>

            <div className="flex-1 flex items-center px-5 first:pl-0">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold text-[#3e8736]">{stats.total_users}</p>
                </div>
            </div>
            <div className="flex-1 flex items-center px-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-3xl font-bold text-[#3e8736]">{stats.active_users}</p>
                </div>
            </div>
            <div className="flex-1 flex items-center px-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                    <p className="text-3xl font-bold text-[#3e8736]">{stats.inactive_users}</p>
                </div>
            </div>
            <div className="flex-1 flex items-center px-4 last:pr-0">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                    <p className="text-3xl font-bold text-[#3e8736]">{stats.admin_users}</p>
                </div>
            </div>
        </div>
    );
}
