<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use Illuminate\Http\Request;

class AuditTrailController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search'     => 'nullable|string|max:255',
            'event_type' => 'nullable|string|max:64',
            'user_id'    => 'nullable|integer|exists:users,id',
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = AuditTrail::with('user:id,name,account_number')
            ->orderByDesc('created_at');

        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', "%{$term}%")
                    ->orWhere('event_type', 'like', "%{$term}%");
            });
        }

        if (!empty($validated['event_type'])) {
            $query->where('event_type', $validated['event_type']);
        }

        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $items = $query->paginate(15)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($items);
        }
        
        // Fetch filters data for the view
        $eventTypes = AuditTrail::query()
            ->select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        $userIds = AuditTrail::query()
            ->select('user_id')
            ->distinct()
            ->whereNotNull('user_id')
            ->pluck('user_id');
            
        $users = \App\Models\User::whereIn('id', $userIds)
            ->orderBy('name')
            ->get(['id', 'name', 'account_number']);

        return \Inertia\Inertia::render('audit-trails/index', [
            'trails' => clone $items,
            'filtersOptions' => [
                'event_types' => $eventTypes,
                'users' => $users,
            ],
            'filters' => $request->only(['search', 'event_type', 'user_id', 'date_from', 'date_to'])
        ]);
    }

    public function filters()
    {
        $eventTypes = AuditTrail::query()
            ->select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        $userIds = AuditTrail::query()
            ->select('user_id')
            ->distinct()
            ->whereNotNull('user_id')
            ->pluck('user_id');
        $users = \App\Models\User::whereIn('id', $userIds)
            ->orderBy('name')
            ->get(['id', 'name', 'account_number']);

        return response()->json([
            'event_types' => $eventTypes,
            'users' => $users,
        ]);
    }
}
