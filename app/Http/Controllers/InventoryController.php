<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    private const SORTABLE = ['created_at', 'record_date', 'acquisition_date', 'amount', 'location', 'supplier_name', 'id'];

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'location' => 'nullable|string|max:255',
            'id' => 'nullable|integer|min:1',
            'bulk' => 'nullable|string|max:255',
            'search' => 'nullable|string|max:255',
            'sort' => 'nullable|string|in:'.implode(',', self::SORTABLE),
            'direction' => 'nullable|string|in:asc,desc',
        ]);

        $query = InventoryItem::query()
            ->with(['creator:id,name,account_number', 'verifier:id,name,account_number']);

        if (! empty($validated['id'])) {
            $query->where('id', $validated['id']);
        }

        if (! empty($validated['location'])) {
            $query->where('location', $validated['location']);
        }

        if (! empty($validated['bulk'])) {
            $query->where('bulk', $validated['bulk']);
        }

        if (! empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('supplier_name', 'like', "%{$term}%")
                    ->orWhere('serial_prefix', 'like', "%{$term}%")
                    ->orWhere('serial_number', 'like', "%{$term}%")
                    ->orWhere('location', 'like', "%{$term}%")
                    ->orWhere('bulk', 'like', "%{$term}%");
            });
        }

        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';
        $query->orderBy($sort, $direction);

        $items = $query->paginate(15)->withQueryString();

        $filterOptions = [
            'locations' => InventoryItem::query()->whereNotNull('location')->distinct()->orderBy('location')->pluck('location'),
            'bulks' => InventoryItem::query()->whereNotNull('bulk')->where('bulk', '!=', '')->distinct()->orderBy('bulk')->pluck('bulk'),
        ];

        return Inertia::render('inventory/index', [
            'items' => $items,
            'filterOptions' => $filterOptions,
            'filters' => $request->only(['location', 'id', 'bulk', 'search', 'sort', 'direction']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/create');
    }

    public function store(Request $request)
    {
        $validated = $this->validatedItemPayload($request);

        InventoryItem::create([
            ...$validated,
            'created_by' => Auth::id(),
            'verification_status' => 'pending',
            'verified_by' => null,
            'verified_at' => null,
            'audit_remarks' => null,
        ]);

        return redirect()->route('inventory.index')->with('success', 'Inventory record created.');
    }

    public function edit(InventoryItem $inventoryItem): Response
    {
        $inventoryItem->load(['creator:id,name,account_number', 'verifier:id,name,account_number']);

        return Inertia::render('inventory/edit', [
            'item' => $inventoryItem,
        ]);
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        if ($inventoryItem->verification_status === 'verified' && ! $request->user()->hasRole('auditor')) {
            abort(403, 'Only an auditor may edit verified inventory records.');
        }

        $validated = $this->validatedItemPayload($request);

        $inventoryItem->update($validated);

        return redirect()->route('inventory.index')->with('success', 'Inventory record updated.');
    }

    public function verify(Request $request, InventoryItem $inventoryItem)
    {
        if ($inventoryItem->verification_status === 'verified') {
            return redirect()->back()->withErrors(['verify' => 'This record is already verified.']);
        }

        $validated = $request->validate([
            'audit_remarks' => 'nullable|string|max:2000',
        ]);

        $inventoryItem->update([
            'verification_status' => 'verified',
            'verified_by' => Auth::id(),
            'verified_at' => now(),
            'audit_remarks' => $validated['audit_remarks'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Inventory record verified.');
    }

    public function monthlyReport(Request $request): Response
    {
        $validated = $request->validate([
            'year' => 'nullable|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        $year = (int) ($validated['year'] ?? now()->year);
        $month = (int) ($validated['month'] ?? now()->month);

        $start = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        $base = InventoryItem::query()
            ->whereBetween('record_date', [$start->toDateString(), $end->toDateString()]);

        $summaryByLocation = (clone $base)
            ->select('location', DB::raw('COUNT(*) as cnt'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('location')
            ->orderBy('location')
            ->get()
            ->map(fn ($row) => [
                'location' => $row->location,
                'count' => (int) $row->cnt,
                'total_amount' => (string) $row->total_amount,
            ]);

        $summaryByBulk = (clone $base)
            ->whereNotNull('bulk')
            ->where('bulk', '!=', '')
            ->select('bulk', DB::raw('COUNT(*) as cnt'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('bulk')
            ->orderBy('bulk')
            ->get()
            ->map(fn ($row) => [
                'bulk' => $row->bulk,
                'count' => (int) $row->cnt,
                'total_amount' => (string) $row->total_amount,
            ]);

        $details = (clone $base)
            ->with(['creator:id,name,account_number', 'verifier:id,name,account_number'])
            ->orderByDesc('created_at')
            ->paginate(30)
            ->appends([
                'year' => $request->input('year', $year),
                'month' => $request->input('month', $month),
            ]);

        return Inertia::render('inventory/monthly-report', [
            'year' => $year,
            'month' => $month,
            'periodLabel' => $start->format('F Y'),
            'summaryByLocation' => $summaryByLocation,
            'summaryByBulk' => $summaryByBulk,
            'details' => $details,
        ]);
    }

    public function yearReport(Request $request): Response
    {
        $validated = $request->validate([
            'mode' => 'nullable|string|in:rolling_12,calendar_year',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        $mode = $validated['mode'] ?? 'rolling_12';
        $year = isset($validated['year']) ? (int) $validated['year'] : (int) now()->year;

        if ($mode === 'rolling_12') {
            $end = Carbon::today();
            $start = (clone $end)->copy()->subYear()->addDay();
            $label = 'Last 12 months (from '.$start->format('M j, Y').' to '.$end->format('M j, Y').')';
        } else {
            $start = Carbon::createFromDate($year, 1, 1)->startOfDay();
            $end = Carbon::createFromDate($year, 12, 31)->endOfDay();
            $label = 'Calendar year '.$year;
        }

        $base = InventoryItem::query()
            ->whereBetween('record_date', [$start->toDateString(), $end->toDateString()]);

        $summaryByLocation = (clone $base)
            ->select('location', DB::raw('COUNT(*) as cnt'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('location')
            ->orderBy('location')
            ->get()
            ->map(fn ($row) => [
                'location' => $row->location,
                'count' => (int) $row->cnt,
                'total_amount' => (string) $row->total_amount,
            ]);

        $grandTotal = (clone $base)->sum('amount');
        $grandCount = (clone $base)->count();

        $records = (clone $base)
            ->with(['creator:id,name,account_number', 'verifier:id,name,account_number'])
            ->orderByDesc('record_date')
            ->orderByDesc('id')
            ->paginate(30)
            ->appends(array_filter([
                'mode' => $mode,
                'year' => $mode === 'calendar_year' ? $year : null,
            ], fn ($v) => $v !== null && $v !== ''));

        return Inertia::render('inventory/year-report', [
            'mode' => $mode,
            'year' => $year,
            'periodLabel' => $label,
            'dateFrom' => $start->toDateString(),
            'dateTo' => $end->toDateString(),
            'summaryByLocation' => $summaryByLocation,
            'grandTotal' => (string) $grandTotal,
            'grandCount' => $grandCount,
            'records' => $records,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedItemPayload(Request $request): array
    {
        return $request->validate([
            'record_date' => 'required|date',
            'acquisition_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'supplier_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'serial_prefix' => 'required|string|max:64',
            'serial_number' => 'required|string|max:128',
            'bulk' => 'nullable|string|max:255',
        ]);
    }
}
