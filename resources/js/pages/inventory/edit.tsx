import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface UserRef {
    id: number;
    name: string;
    account_number: string;
}

interface InventoryItemRow {
    id: number;
    record_date: string;
    acquisition_date: string;
    amount: string;
    supplier_name: string;
    location: string;
    serial_prefix: string;
    serial_number: string;
    bulk: string | null;
    verification_status: string;
    verified_at: string | null;
    audit_remarks: string | null;
    creator?: UserRef | null;
    verifier?: UserRef | null;
}

interface Props {
    item: InventoryItemRow;
}

export default function InventoryEdit({ item }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Inventory', href: route('inventory.index') },
        { title: `Edit #${item.id}`, href: route('inventory.edit', { inventoryItem: item.id }) },
    ];

    const formatDate = (d: string) => (d && d.length >= 10 ? d.slice(0, 10) : d);

    const { data, setData, put, processing, errors } = useForm({
        record_date: formatDate(item.record_date),
        acquisition_date: formatDate(item.acquisition_date),
        amount: String(item.amount),
        supplier_name: item.supplier_name,
        location: item.location,
        serial_prefix: item.serial_prefix,
        serial_number: item.serial_number,
        bulk: item.bulk ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('inventory.update', { inventoryItem: item.id }), {
            onSuccess: () => toast.success('Inventory record updated.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit inventory #${item.id}`} />
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-header">Edit inventory #{item.id}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant={item.verification_status === 'verified' ? 'default' : 'secondary'}>
                                {item.verification_status === 'verified' ? 'Verified' : 'Pending verification'}
                            </Badge>
                            {item.creator && (
                                <span className="text-muted-foreground text-sm">
                                    Created by {item.creator.name} (#{item.creator.account_number})
                                </span>
                            )}
                            {item.verifier && (
                                <span className="text-muted-foreground text-sm">
                                    Verified by {item.verifier.name} (#{item.verifier.account_number})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Item details</CardTitle>
                        <CardDescription>Update fields as needed. Verified records can only be edited by an Auditor.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-6 max-w-2xl">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="record_date">Record date</Label>
                                    <Input
                                        id="record_date"
                                        type="date"
                                        value={data.record_date}
                                        onChange={(e) => setData('record_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.record_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="acquisition_date">Date of acquisition</Label>
                                    <Input
                                        id="acquisition_date"
                                        type="date"
                                        value={data.acquisition_date}
                                        onChange={(e) => setData('acquisition_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.acquisition_date} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="supplier_name">Supplier name</Label>
                                <Input
                                    id="supplier_name"
                                    value={data.supplier_name}
                                    onChange={(e) => setData('supplier_name', e.target.value)}
                                    required
                                    maxLength={255}
                                />
                                <InputError message={errors.supplier_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                />
                                <InputError message={errors.amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    required
                                    maxLength={255}
                                />
                                <InputError message={errors.location} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="serial_prefix">Serial prefix</Label>
                                    <Input
                                        id="serial_prefix"
                                        value={data.serial_prefix}
                                        onChange={(e) => setData('serial_prefix', e.target.value)}
                                        required
                                        maxLength={64}
                                    />
                                    <InputError message={errors.serial_prefix} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="serial_number">Serial number</Label>
                                    <Input
                                        id="serial_number"
                                        value={data.serial_number}
                                        onChange={(e) => setData('serial_number', e.target.value)}
                                        required
                                        maxLength={128}
                                    />
                                    <InputError message={errors.serial_number} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bulk">Bulk / grouping (optional)</Label>
                                <Input
                                    id="bulk"
                                    value={data.bulk}
                                    onChange={(e) => setData('bulk', e.target.value)}
                                    maxLength={255}
                                />
                                <InputError message={errors.bulk} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving…' : 'Save changes'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('inventory.index')}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
