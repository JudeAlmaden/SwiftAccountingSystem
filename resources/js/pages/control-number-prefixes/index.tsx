import { Head } from '@inertiajs/react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export default function ControlNumberPrefixesPage() {
    const [prefixes, setPrefixes] = useState<Prefix[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formCode, setFormCode] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    const fetchPrefixes = () => {
        fetch('/api/control-number-prefixes', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
            .then((data) => setPrefixes(data.data || []))
            .catch(() => setPrefixes([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPrefixes();
    }, []);

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
        const url = editingId
            ? `/api/control-number-prefixes/${editingId}`
            : '/api/control-number-prefixes';
        const method = editingId ? 'PUT' : 'POST';
        const body = JSON.stringify({ code: formCode.trim(), label: formLabel.trim() || null });
        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': token,
            },
            credentials: 'include',
            body,
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    setModalOpen(false);
                    fetchPrefixes();
                } else {
                    setError(data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to save'));
                }
            })
            .catch(() => setError('Request failed'))
            .finally(() => setSaving(false));
    };

    const handleDelete = (p: Prefix) => {
        if (!confirm(`Delete prefix "${p.code}"? This may affect new disbursement control numbers.`)) return;
        fetch(`/api/control-number-prefixes/${p.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token },
            credentials: 'include',
        })
            .then((res) => {
                if (res.ok) fetchPrefixes();
            });
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
                        {loading ? (
                            <p className="text-muted-foreground">Loading…</p>
                        ) : prefixes.length === 0 ? (
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
