import { ShieldCheck, ShieldAlert, Edit, Trash, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/types/database';

interface RoleCardProps {
    role: Role;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
    onReset: (role: Role) => void;
    systemRoles: string[];
}

export function RoleCard({ role, onEdit, onDelete, onReset, systemRoles }: RoleCardProps) {
    const isSystem = systemRoles.includes(role.name);
    
    // Group permissions roughly by module for better display
    const permissions = role.permissions || [];
    
    return (
        <Card className="flex flex-col h-full border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 overflow-hidden relative rounded-xl">
            {/* Subtle top indicator line */}
            {isSystem && <div className="absolute top-0 left-0 right-0 h-1 bg-[#16c42d]" />}

            <CardHeader className="pb-3 pt-6 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2 text-gray-900">
                        {isSystem ? <ShieldCheck className="w-5 h-5 text-[#16c42d]" /> : <ShieldAlert className="w-5 h-5 text-gray-400 group-hover:text-[#16c42d] transition-colors" />}
                        <span className="capitalize tracking-tight">{role.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1 font-medium">
                        {isSystem ? <span className="text-[#16c42d]/90">System Role (Protected)</span> : <span className="text-gray-500">Custom Role</span>}
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full shadow-sm">
                        {permissions.length} Perms
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col pt-2 pb-5">
                <div className="flex-grow mb-6">
                    {permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                            {permissions.map(p => (
                                <span key={p.id} className="inline-flex items-center rounded-sm bg-[#e8f3ea] border border-[#d1e9d5]/60 px-2 py-0.5 text-[11px] font-medium text-[#02310b] hover:bg-[#d1e9d5] transition-colors cursor-default">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic mt-2 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">No permissions assigned.</p>
                    )}
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 gap-3">
                    <Button variant="outline" size="sm" className="flex-1 shadow-sm hover:bg-gray-50 transition-all font-medium text-gray-700" onClick={() => onEdit(role)}>
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Edit
                    </Button>
                    
                    {isSystem ? (
                        <Button variant="outline" size="sm" className="flex-1 font-medium shadow-sm text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={() => onReset(role)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            Reset
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" className="flex-1 font-medium shadow-sm text-red-600 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all" onClick={() => onDelete(role)}>
                            <Trash className="w-3.5 h-3.5 mr-2 text-red-400" />
                            Delete
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
