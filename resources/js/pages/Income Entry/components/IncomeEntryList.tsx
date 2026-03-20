import { format } from 'date-fns';
import { Plus, ReceiptText, Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProposedChanges from './ProposedChanges';

interface IncomeEntryListProps {
    date: Date | undefined;
    entries: any[];
    isToday: boolean;
    canAddIncome: boolean;
    roles: string[];
    onAddIncome: () => void;
    onEditEntry: (entry: any) => void;
}

export default function IncomeEntryList({
    date,
    entries,
    isToday,
    canAddIncome,
    roles,
    onAddIncome,
    onEditEntry,
}: IncomeEntryListProps) {
    return (
        <Card className="flex-1 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        {date ? format(date, 'MMMM d, yyyy') : 'No Date Selected'}
                        {isToday && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Today</span>}
                        {entries?.some((e: any) => e.status === 'pending' && e.proposed_data) && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider animate-pulse">Pending Edit Approval</span>
                        )}
                    </CardTitle>

                    <CardDescription>
                        {entries?.length || 0} income entry recorded for this day.
                    </CardDescription>
                </div>
                {canAddIncome && (
                    <Button className="gap-2" onClick={onAddIncome}>
                        <Plus className="h-4 w-4" />
                        <span>Add Income</span>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-6 px-10">
                {entries && entries.length > 0 ? (
                    <div className="space-y-8">
                        {entries.map((entry: any) => (
                            <div key={entry.id} className="space-y-6">
                                {/* Items Table */}
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">Accounting Details</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#159630] text-primary-foreground text-[10px] uppercase tracking-wider font-bold">
                                                <tr>
                                                    <th className="px-6 py-3.5">Account</th>
                                                    <th className="px-6 py-3.5 text-right w-[150px]">Debit</th>
                                                    <th className="px-6 py-3.5 text-right w-[150px]">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-white">
                                                {entry.items?.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-foreground text-[13px]">{item.account?.account_name || 'Unknown Account'}</span>
                                                                <span className="text-[11px] text-muted-foreground font-medium">{item.account?.account_code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-foreground">
                                                            {item.type === 'debit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-foreground">
                                                            {item.type === 'credit' ? parseFloat(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-muted/20 font-bold border-t-[1.6px] border-[#159630]/30">
                                                <tr>
                                                    <td className="px-6 py-4 uppercase tracking-wider text-[11px] text-foreground">Total Summary</td>
                                                    <td className="px-6 py-4 text-right tabular-nums text-[#159630] text-[15px]">
                                                        {entry.items?.filter((i: any) => i.type === 'debit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right tabular-nums text-[#159630] text-[15px]">
                                                        {entry.items?.filter((i: any) => i.type === 'credit').reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 pb-2">
                                    {roles.some((r: string) => r.toLowerCase() === 'accounting head') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={entry.status === 'pending' && entry.proposed_data}
                                            className="gap-2 border-primary/50 border-[1.6px] h-9 text-primary hover:bg-primary/5 font-semibold disabled:opacity-70"
                                            onClick={() => onEditEntry(entry)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span>{entry.status === 'pending' && entry.proposed_data ? 'Pending Approval' : 'Edit Entry'}</span>
                                        </Button>
                                    )}
                                </div>

                                <ProposedChanges entry={entry} roles={roles} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full pt-20 text-center pb-20">
                        <div className="bg-muted/50 rounded-full p-6 mb-4">
                            {canAddIncome ? (
                                <ReceiptText className="h-10 w-10 text-primary/60" />
                            ) : (
                                <Info className="h-10 w-10 text-muted-foreground/60" />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground/80">
                            {canAddIncome ? "Ready to record income?" : "No entries found"}
                        </h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                            {canAddIncome
                                ? "As an Accounting Head, you can record a manual income entry for today. Click the button above to start."
                                : entries && entries.length > 0
                                    ? "A manual income entry has already been recorded for this date."
                                    : "It looks like there are no income entries recorded for this date."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
