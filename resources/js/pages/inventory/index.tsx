import { DottedSeparator } from '@/components/dotted-line';
import { StatusIndicator } from '@/components/status-indicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { InventoryItem, InventoryMovement } from '@/types/database';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    Boxes,
    PackageCheck,
    PackageOpen,
    Plus,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

type PaginatedItems = {
    data: InventoryItem[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    search: string;
    status: 'all' | 'active' | 'inactive';
    stock_state: 'all' | 'low' | 'in-stock' | 'out-of-stock';
};

type PageProps = {
    items: PaginatedItems;
    recentMovements: InventoryMovement[];
    stats: {
        total_items: number;
        active_items: number;
        low_stock_items: number;
        out_of_stock_items: number;
    };
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Inventory', href: route('inventory.index') },
];

const emptyItemForm = {
    sku: '',
    name: '',
    description: '',
    unit: '',
    quantity_on_hand: '0',
    low_stock_threshold: '0',
    status: 'active',
};

const emptyAdjustmentForm = {
    type: 'increase',
    quantity: '1',
    reason: '',
};

function InventoryItemDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
}) {
    const isEditing = Boolean(item);
    const [form, setForm] = useState(emptyItemForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setForm(emptyItemForm);
            setErrors({});
            setSaving(false);
            return;
        }

        if (item) {
            setForm({
                sku: item.sku,
                name: item.name,
                description: item.description ?? '',
                unit: item.unit ?? '',
                quantity_on_hand: String(item.quantity_on_hand),
                low_stock_threshold: String(item.low_stock_threshold),
                status: item.status,
            });
            return;
        }

        setForm(emptyItemForm);
    }, [item, open]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});

        const payload = isEditing
            ? {
                  sku: form.sku,
                  name: form.name,
                  description: form.description || null,
                  unit: form.unit || null,
                  low_stock_threshold: Number(form.low_stock_threshold),
                  status: form.status,
              }
            : {
                  sku: form.sku,
                  name: form.name,
                  description: form.description || null,
                  unit: form.unit || null,
                  quantity_on_hand: Number(form.quantity_on_hand),
                  low_stock_threshold: Number(form.low_stock_threshold),
                  status: form.status,
              };

        const onFinish = () => setSaving(false);
        const onSuccess = () => onOpenChange(false);
        const onError = (nextErrors: Record<string, string>) =>
            setErrors(nextErrors);

        if (isEditing && item) {
            router.put(route('inventory.update', item.id), payload, {
                preserveScroll: true,
                onFinish,
                onSuccess,
                onError,
            });
            return;
        }

        router.post(route('inventory.store'), payload, {
            preserveScroll: true,
            onFinish,
            onSuccess,
            onError,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
                <DialogHeader className="gap-1 px-6 pt-6">
                    <DialogTitle className="text-table-head pt-1 text-2xl">
                        {isEditing
                            ? 'Edit inventory item'
                            : 'Add inventory item'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {isEditing
                            ? 'Update item details without changing the current stock.'
                            : 'Create a new stock item for the inventory module.'}
                    </DialogDescription>
                </DialogHeader>
                <DottedSeparator />
                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                                id="sku"
                                value={form.sku}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        sku: event.target.value,
                                    })
                                }
                                className="rounded-sm border-[1.7px] border-gray-300"
                                placeholder="INV-001"
                                required
                            />
                            {errors.sku && (
                                <p className="text-sm text-red-500">
                                    {errors.sku}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Item name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value,
                                    })
                                }
                                className="rounded-sm border-[1.7px] border-gray-300"
                                placeholder="Printer paper"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                                id="unit"
                                value={form.unit}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        unit: event.target.value,
                                    })
                                }
                                className="rounded-sm border-[1.7px] border-gray-300"
                                placeholder="ream, pcs, box"
                            />
                            {errors.unit && (
                                <p className="text-sm text-red-500">
                                    {errors.unit}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value) =>
                                    setForm({ ...form, status: value })
                                }
                            >
                                <SelectTrigger className="rounded-sm border-[1.7px] border-gray-300">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-red-500">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        {!isEditing && (
                            <div className="grid gap-2">
                                <Label htmlFor="quantity_on_hand">
                                    Starting quantity
                                </Label>
                                <Input
                                    id="quantity_on_hand"
                                    type="number"
                                    min="0"
                                    value={form.quantity_on_hand}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            quantity_on_hand:
                                                event.target.value,
                                        })
                                    }
                                    className="rounded-sm border-[1.7px] border-gray-300"
                                    required
                                />
                                {errors.quantity_on_hand && (
                                    <p className="text-sm text-red-500">
                                        {errors.quantity_on_hand}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="low_stock_threshold">
                                Low-stock threshold
                            </Label>
                            <Input
                                id="low_stock_threshold"
                                type="number"
                                min="0"
                                value={form.low_stock_threshold}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        low_stock_threshold: event.target.value,
                                    })
                                }
                                className="rounded-sm border-[1.7px] border-gray-300"
                                required
                            />
                            {errors.low_stock_threshold && (
                                <p className="text-sm text-red-500">
                                    {errors.low_stock_threshold}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                            className="min-h-28 rounded-sm border-[1.7px] border-gray-300 px-3 py-2 text-sm outline-none"
                            placeholder="Optional notes for this item"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving
                                ? 'Saving...'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Create item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function InventoryAdjustmentDialog({
    open,
    onOpenChange,
    item,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
}) {
    const [form, setForm] = useState(emptyAdjustmentForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(emptyAdjustmentForm);
            setErrors({});
            setSaving(false);
        }
    }, [open]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!item) return;

        setSaving(true);
        setErrors({});

        router.post(
            route('inventory.adjustments.store', item.id),
            {
                type: form.type,
                quantity: Number(form.quantity),
                reason: form.reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onError: (nextErrors: Record<string, string>) =>
                    setErrors(nextErrors),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 sm:max-w-lg">
                <DialogHeader className="gap-1 px-6 pt-6">
                    <DialogTitle className="text-table-head pt-1 text-2xl">
                        Adjust stock
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {item
                            ? `Update the on-hand quantity for ${item.name}.`
                            : 'Update the on-hand quantity.'}
                    </DialogDescription>
                </DialogHeader>
                <DottedSeparator />
                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="bg-card-subtle rounded-sm border border-[#dbe9dd] p-4">
                        <p className="text-header text-sm font-semibold">
                            {item?.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Current stock:{' '}
                            <span className="font-semibold text-foreground">
                                {item?.quantity_on_hand ?? 0}
                            </span>
                            {item?.unit ? ` ${item.unit}` : ''}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="adjustment_type">Adjustment type</Label>
                        <Select
                            value={form.type}
                            onValueChange={(value) =>
                                setForm({ ...form, type: value })
                            }
                        >
                            <SelectTrigger className="rounded-sm border-[1.7px] border-gray-300">
                                <SelectValue placeholder="Select adjustment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="increase">
                                    Increase stock
                                </SelectItem>
                                <SelectItem value="decrease">
                                    Decrease stock
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={form.quantity}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    quantity: event.target.value,
                                })
                            }
                            className="rounded-sm border-[1.7px] border-gray-300"
                            required
                        />
                        {errors.quantity && (
                            <p className="text-sm text-red-500">
                                {errors.quantity}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Input
                            id="reason"
                            value={form.reason}
                            onChange={(event) =>
                                setForm({ ...form, reason: event.target.value })
                            }
                            className="rounded-sm border-[1.7px] border-gray-300"
                            placeholder="Restocked from supplier"
                            required
                        />
                        {errors.reason && (
                            <p className="text-sm text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Apply adjustment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function InventoryPage() {
    const { items, recentMovements, stats, filters } =
        usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [stockState, setStockState] = useState(filters.stock_state);
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(
        null,
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (
                search === filters.search &&
                status === filters.status &&
                stockState === filters.stock_state
            ) {
                return;
            }

            const params: Record<string, string> = {
                search,
                status,
                stock_state: stockState,
            };

            Object.keys(params).forEach((key) => {
                if (!params[key] || params[key] === 'all') {
                    delete params[key];
                }
            });

            router.get(route('inventory.index'), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [
        filters.search,
        filters.status,
        filters.stock_state,
        search,
        status,
        stockState,
    ]);

    const openCreate = () => {
        setSelectedItem(null);
        setItemDialogOpen(true);
    };

    const openEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setItemDialogOpen(true);
    };

    const openAdjustment = (item: InventoryItem) => {
        setSelectedItem(item);
        setAdjustDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-header text-3xl">Inventory</h1>
                        <p className="max-w-2xl text-muted-foreground">
                            Manage item stock in a separate inventory module
                            using the same authenticated dashboard shell.
                        </p>
                    </div>

                    <Button onClick={openCreate} className="gap-2 self-start">
                        <Plus className="h-4 w-4" />
                        Add item
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-sm border-[#dbe9dd] py-0">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="bg-subtle-green text-header rounded-sm p-3">
                                <Boxes className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total items
                                </p>
                                <p className="text-header text-2xl font-black">
                                    {stats.total_items}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-[#dbe9dd] py-0">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="bg-subtle-green text-header rounded-sm p-3">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Active items
                                </p>
                                <p className="text-header text-2xl font-black">
                                    {stats.active_items}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-[#dbe9dd] py-0">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-sm bg-[#fff7e8] p-3 text-[#9a6700]">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Low stock
                                </p>
                                <p className="text-header text-2xl font-black">
                                    {stats.low_stock_items}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-sm border-[#dbe9dd] py-0">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="rounded-sm bg-[#fff0f0] p-3 text-[#b42318]">
                                <PackageOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Out of stock
                                </p>
                                <p className="text-header text-2xl font-black">
                                    {stats.out_of_stock_items}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <Card className="overflow-hidden rounded-sm py-0">
                        <CardHeader className="bg-card-subtle gap-3 border-b px-6 py-5">
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-header text-2xl">
                                    Stock items
                                </CardTitle>
                                <CardDescription>
                                    Search, update item details, and apply stock
                                    adjustments.
                                </CardDescription>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search name or SKU..."
                                        className="rounded-sm border-[1.7px] border-gray-300 bg-white pl-9"
                                    />
                                </div>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(value as Filters['status'])
                                    }
                                >
                                    <SelectTrigger className="rounded-sm border-[1.7px] border-gray-300 bg-white">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All statuses
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={stockState}
                                    onValueChange={(value) =>
                                        setStockState(
                                            value as Filters['stock_state'],
                                        )
                                    }
                                >
                                    <SelectTrigger className="rounded-sm border-[1.7px] border-gray-300 bg-white">
                                        <SelectValue placeholder="Stock state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All stock states
                                        </SelectItem>
                                        <SelectItem value="low">
                                            Low stock
                                        </SelectItem>
                                        <SelectItem value="in-stock">
                                            In stock
                                        </SelectItem>
                                        <SelectItem value="out-of-stock">
                                            Out of stock
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="border-0">
                                    <TableRow className="bg-table-head hover:bg-table-head border-0">
                                        <TableHead className="bg-table-head px-4 py-5 text-base font-extrabold text-white first:rounded-tl-sm">
                                            Item
                                        </TableHead>
                                        <TableHead className="bg-table-head px-4 py-5 text-base font-extrabold text-white">
                                            SKU
                                        </TableHead>
                                        <TableHead className="bg-table-head px-4 py-5 text-base font-extrabold text-white">
                                            Stock
                                        </TableHead>
                                        <TableHead className="bg-table-head px-4 py-5 text-base font-extrabold text-white">
                                            Status
                                        </TableHead>
                                        <TableHead className="bg-table-head px-4 py-5 text-base font-extrabold text-white last:rounded-tr-sm">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                No inventory items found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.data.map((item) => {
                                            const isLow =
                                                item.quantity_on_hand <=
                                                item.low_stock_threshold;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="px-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-header font-semibold">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-sm text-muted-foreground">
                                                                {item.description ||
                                                                    'No description provided'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 font-medium">
                                                        {item.sku}
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-semibold">
                                                                {
                                                                    item.quantity_on_hand
                                                                }{' '}
                                                                {item.unit ||
                                                                    'units'}
                                                            </span>
                                                            {isLow && (
                                                                <Badge className="rounded-sm bg-[#fff7e8] text-[#9a6700] hover:bg-[#fff7e8]">
                                                                    Low stock
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Threshold:{' '}
                                                            {
                                                                item.low_stock_threshold
                                                            }
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <StatusIndicator
                                                            status={item.status}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    openAdjustment(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                Adjust
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex flex-col gap-3 border-t px-6 py-4 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {items.from ?? 0} to {items.to ?? 0}{' '}
                                    of {items.total} items
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!items.prev_page_url}
                                        onClick={() =>
                                            items.prev_page_url &&
                                            router.get(
                                                items.prev_page_url,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!items.next_page_url}
                                        onClick={() =>
                                            items.next_page_url &&
                                            router.get(
                                                items.next_page_url,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm py-0">
                        <CardHeader className="bg-card-subtle border-b px-6 py-5">
                            <CardTitle className="text-header text-2xl">
                                Recent adjustments
                            </CardTitle>
                            <CardDescription>
                                Latest stock movements recorded by authenticated
                                users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 py-5">
                            {recentMovements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No stock adjustments have been recorded yet.
                                </p>
                            ) : (
                                recentMovements.map((movement, index) => (
                                    <div key={movement.id}>
                                        <div className="flex gap-3">
                                            <div
                                                className={`mt-1 rounded-sm p-2 ${
                                                    movement.type === 'increase'
                                                        ? 'bg-subtle-green text-header'
                                                        : 'bg-[#fff0f0] text-[#b42318]'
                                                }`}
                                            >
                                                {movement.type ===
                                                'increase' ? (
                                                    <ArrowUp className="h-4 w-4" />
                                                ) : (
                                                    <ArrowDown className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-header font-semibold">
                                                            {
                                                                movement.item
                                                                    ?.name
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {movement.item?.sku}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className={`rounded-sm ${
                                                            movement.type ===
                                                            'increase'
                                                                ? 'bg-subtle-green text-header hover:bg-subtle-green'
                                                                : 'bg-[#fff0f0] text-[#b42318] hover:bg-[#fff0f0]'
                                                        }`}
                                                    >
                                                        {movement.type ===
                                                        'increase'
                                                            ? '+'
                                                            : '-'}
                                                        {movement.quantity}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-sm text-foreground">
                                                    {movement.reason}
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    By{' '}
                                                    {movement.user?.name ||
                                                        'Unknown user'}{' '}
                                                    on{' '}
                                                    {movement.created_at
                                                        ? format(
                                                              new Date(
                                                                  movement.created_at,
                                                              ),
                                                              'MMM d, yyyy h:mm a',
                                                          )
                                                        : 'Unknown date'}
                                                </p>
                                            </div>
                                        </div>
                                        {index < recentMovements.length - 1 && (
                                            <DottedSeparator className="mt-4" />
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <InventoryItemDialog
                open={itemDialogOpen}
                onOpenChange={setItemDialogOpen}
                item={selectedItem}
            />
            <InventoryAdjustmentDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                item={selectedItem}
            />
        </AppLayout>
    );
}
