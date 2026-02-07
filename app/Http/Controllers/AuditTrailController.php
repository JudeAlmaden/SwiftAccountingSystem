<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use Illuminate\Http\Request;

class AuditTrailController extends Controller
{
    public function indexPage()
    {
        return \Inertia\Inertia::render('audit-trails/index');
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search'     => 'nullable|string|max:255',
            'event_type' => 'nullable|string|max:64',
            'user_id'    => 'nullable|integer|exists:users,id',
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date|after_or_equal:date_from',
            'page'       => 'nullable|integer|min:1',
            'per_page'   => 'nullable|integer|min:1|max:50',
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

        $perPage = $validated['per_page'] ?? 15;
        $items = $query->paginate($perPage);

        return response()->json([
            'data' => $items->items(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'per_page' => $items->perPage(),
            'total' => $items->total(),
            'from' => $items->firstItem(),
            'to' => $items->lastItem(),
            'next_page_url' => $items->nextPageUrl(),
            'prev_page_url' => $items->previousPageUrl(),
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
