import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Inventory', href: route('inventory.index') },
    { title: 'Create', href: route('inventory.create') },
];

const today = () => new Date().toISOString().slice(0, 10);

export default function InventoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        record_date: today(),
        acquisition_date: today(),
        amount: '',
        supplier_name: '',
        location: '',
        serial_prefix: '',
        serial_number: '',
        bulk: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inventory.store'), {
            onSuccess: () => toast.success('Inventory record saved.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create inventory record" />
            <div className="space-y-6 p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('inventory.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-header">New inventory record</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Ma&apos;am Joy (Inventory Clerk) to be verified by the Auditor.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Item details</CardTitle>
                        <CardDescription>Enter supplier, dates, location, and serial information.</CardDescription>
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
                                    {processing ? 'Saving…' : 'Save record'}
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
