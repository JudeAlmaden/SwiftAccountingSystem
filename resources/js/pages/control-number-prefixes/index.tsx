import { Head, router } from '@inertiajs/react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Control number prefixes', href: route('control-number-prefixes.index') },
];

interface Prefix {
    id: number;
    code: string;
    label: string | null;
    sort_order: number;
}

interface Props {
    prefixes: Prefix[];
}

export default function ControlNumberPrefixesPage({ prefixes }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formCode, setFormCode] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openCreate = () => {
        setEditingId(null);
        setFormCode('');
        setFormLabel('');
        setError(null);
        setModalOpen(true);
    };

    const openEdit = (p: Prefix) => {
        setEditingId(p.id);
        setFormCode(p.code);
        setFormLabel(p.label || '');
        setError(null);
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const data = { code: formCode.trim(), label: formLabel.trim() || null };
        const onError = (errors: any) => {
            setError(Object.values(errors).flat().join(' ') || 'Failed to save');
            setSaving(false);
        };
        const onSuccess = () => { setModalOpen(false); setSaving(false); };
        if (editingId) {
            router.put(route('api.control-number-prefixes.update', { controlNumberPrefix: editingId }), data, { onSuccess, onError });
        } else {
            router.post(route('api.control-number-prefixes.store'), data, { onSuccess, onError });
        }
    };

    const handleDelete = (p: Prefix) => {
        if (!confirm(`Delete prefix "${p.code}"? This may affect new disbursement control numbers.`)) return;
        router.delete(route('api.control-number-prefixes.destroy', { controlNumberPrefix: p.id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control number prefixes" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Control number prefixes</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage prefixes used when creating disbursements (e.g. DV, HED, JHS). Accounting head only.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add prefix
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Prefixes</CardTitle>
                        <CardDescription>These appear in the dropdown when creating a disbursement. Control number format: PREFIX-YY-RANDOM6 (e.g. DV-26-ABC123).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {prefixes.length === 0 ? (
                            <p className="text-muted-foreground">No prefixes yet. Add one to use when creating disbursements.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead className="w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prefixes.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono font-medium">{p.code}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.label || '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit prefix' : 'Add prefix'}</DialogTitle>
                        <DialogDescription>Code is used in the control number (e.g. HED for Higher Ed Department).</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value.toUpperCase().slice(0, 20))}
                                    placeholder="e.g. HED, JHS"
                                    required
                                    maxLength={20}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="label">Label (optional)</Label>
                                <Input
                                    id="label"
                                    value={formLabel}
                                    onChange={(e) => setFormLabel(e.target.value)}
                                    placeholder="e.g. Higher Ed Department"
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
