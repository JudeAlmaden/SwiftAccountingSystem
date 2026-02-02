import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import type { User } from '@/types/database';
import { DottedSeparator } from '@/components/dotted-line';
import { StatusIndicator } from '@/components/status-indicator';

interface SpecialUserCardProps {
    title: string;
    users: User[];
    icon: any;
    onEdit: (user: User) => void;
    onAssign?: () => void;
}

export function SpecialUserCard({
    title,
    users,
    icon: Icon,
    onEdit,
    onAssign
}: SpecialUserCardProps) {
    const user = users[0];

    const descriptions: Record<string, string> = {
        'Accounting Head': 'Manages financial records.',
        'SVP': 'Oversees operations.',
        'Auditor': 'Reviews financial records.',
    };

    return (
        <Card className="overflow-hidden border-[1.6px] border-gray-300 rounded-lg flex flex-col">
            <div className="flex items-center gap-3 px-4">
                <div className="p-2.5 bg-[#16c42d] rounded-lg text-white">
                    <Icon className="size-5" />
                </div>
                <div className='flex flex-col'>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className='text-gray-500 text-sm'>{descriptions[title] || ''}</p>
                </div>
            </div>
            <DottedSeparator />
            <CardContent className="px-4 flex flex-col flex-1">
                {user ? (
                    <>
                        <div className="flex-1 mb-15">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <p className="font-medium text-base">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <StatusIndicator status={user.status as 'active' | 'inactive'} />
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(user)}>
                            Edit User
                        </Button>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-4 text-center space-y-3">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                            <UserPlus className="size-5 text-muted-foreground/60" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">No user assigned</p>
                            <p className="text-xs text-muted-foreground/80">Assign a user to this role</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
