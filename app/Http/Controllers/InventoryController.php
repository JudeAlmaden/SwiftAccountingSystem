<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string',
            'status' => 'nullable|in:all,active,inactive',
            'stock_state' => 'nullable|in:all,low,in-stock,out-of-stock',
            'page' => 'nullable|integer|min:1',
        ]);

        $query = InventoryItem::query()->latest();

        if (! empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (($validated['status'] ?? 'all') !== 'all') {
            $query->where('status', $validated['status']);
        }

        match ($validated['stock_state'] ?? 'all') {
            'low' => $query->whereColumn('quantity_on_hand', '<=', 'low_stock_threshold'),
            'in-stock' => $query->where('quantity_on_hand', '>', 0),
            'out-of-stock' => $query->where('quantity_on_hand', 0),
            default => null,
        };

        $items = $query->paginate(10)->withQueryString();

        $recentMovements = InventoryMovement::query()
            ->with(['item:id,name,sku,unit', 'user:id,name'])
            ->latest()
            ->limit(10)
            ->get();

        $stats = [
            'total_items' => InventoryItem::count(),
            'active_items' => InventoryItem::where('status', 'active')->count(),
            'low_stock_items' => InventoryItem::whereColumn('quantity_on_hand', '<=', 'low_stock_threshold')->count(),
            'out_of_stock_items' => InventoryItem::where('quantity_on_hand', 0)->count(),
        ];

        return Inertia::render('inventory/index', [
            'items' => $items,
            'recentMovements' => $recentMovements,
            'stats' => $stats,
            'filters' => [
                'search' => $validated['search'] ?? '',
                'status' => $validated['status'] ?? 'all',
                'stock_state' => $validated['stock_state'] ?? 'all',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:100|unique:inventory_items,sku',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:50',
            'quantity_on_hand' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        InventoryItem::create($validated);

        return redirect()->route('inventory.index')
            ->with('message', 'Inventory item created successfully.');
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:100|unique:inventory_items,sku,' . $inventoryItem->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:50',
            'low_stock_threshold' => 'required|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $inventoryItem->update($validated);

        return redirect()->route('inventory.index')
            ->with('message', 'Inventory item updated successfully.');
    }

    public function storeAdjustment(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'type' => 'required|in:increase,decrease',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($request, $inventoryItem, $validated) {
            $inventoryItem->refresh();

            if ($validated['type'] === 'decrease' && $inventoryItem->quantity_on_hand < $validated['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'The quantity exceeds the available stock.',
                ]);
            }

            $inventoryItem->update([
                'quantity_on_hand' => $validated['type'] === 'increase'
                    ? $inventoryItem->quantity_on_hand + $validated['quantity']
                    : $inventoryItem->quantity_on_hand - $validated['quantity'],
            ]);

            InventoryMovement::create([
                'inventory_item_id' => $inventoryItem->id,
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'reason' => $validated['reason'],
            ]);
        });

        return redirect()->route('inventory.index')
            ->with('message', 'Stock adjusted successfully.');
    }
}
