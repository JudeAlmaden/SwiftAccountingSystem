import { Info } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ProposedChangesProps {
    entry: any;
    roles: string[];
}

export default function ProposedChanges({ entry, roles }: ProposedChangesProps) {
    if (entry.status !== 'pending' || !entry.proposed_data) return null;

    const accounts = (usePage<any>().props.accounts as any[]) || [];

    return (
        <div className="mt-10 space-y-6 border-t-2 border-dashed border-amber-200 pt-8">
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <Info className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-amber-900 uppercase tracking-tight">Proposed New Changes</h4>
                        <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Historical Edit Request</p>
                    </div>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full uppercase font-black tracking-widest border-2 border-amber-200 animate-pulse">Pending Review</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest ml-1">New Title</p>
                    <div className="px-4 py-3 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg text-sm font-bold text-amber-900 shadow-sm">
                        {entry.proposed_data.title}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest ml-1">New Description</p>
                    <div className="px-4 py-3 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg text-sm font-bold text-amber-900 shadow-sm italic">
                        "{entry.proposed_data.description}"
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-3 ml-1">New Accounting Details</p>
                <div className="border-2 border-amber-200 rounded-xl overflow-hidden shadow-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-amber-500 text-white text-[11px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4 text-right w-[150px]">Debit</th>
                                <th className="px-6 py-4 text-right w-[150px]">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 bg-white">
                            {entry.proposed_data.accounts?.map((item: any, idx: number) => {
                                const acc = accounts.find(a => a.id === item.account_id);
                                return (
                                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-amber-900 text-[13px]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-amber-900">{acc?.account_name || 'Unknown Account'}</span>
                                                <span className="text-[11px] text-amber-600/80 font-black uppercase tracking-tighter">{acc?.account_code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black tabular-nums text-amber-900 text-base">
                                            {item.type === 'debit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black tabular-nums text-amber-900 text-base">
                                            {item.type === 'credit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-amber-50 font-black border-t-2 border-amber-200">
                            <tr>
                                <td className="px-6 py-5 uppercase tracking-widest text-[12px] text-amber-900">Total Proposed Summary</td>
                                <td className="px-6 py-5 text-right tabular-nums text-amber-600 text-[18px]">
                                    {entry.proposed_data.accounts?.filter((i: any) => i.type === 'debit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-5 text-right tabular-nums text-amber-600 text-[18px]">
                                    {entry.proposed_data.accounts?.filter((i: any) => i.type === 'credit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {roles.some((r: string) => r.toLowerCase() === 'auditor') && (
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 h-9 font-bold"
                        onClick={() => {
                            if (confirm('Are you sure you want to approve these historical changes?')) {
                                router.post(route('vouchers.approve', { id: entry.id }), {}, {
                                    onSuccess: () => toast.success('Historical edit approved and applied successfully.')
                                });
                            }
                        }}
                    >
                        <span>Approve Edit</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 h-9 font-bold"
                        onClick={() => {
                            if (confirm('Are you sure you want to decline these historical changes?')) {
                                router.post(route('vouchers.decline', { id: entry.id }), {}, {
                                    onSuccess: () => toast.success('Historical edit request declined.')
                                });
                            }
                        }}
                    >
                        <span>Decline Edit</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
