<?php

namespace App\Http\Controllers;

use App\Models\ControlNumberPrefix;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlNumberPrefixController extends Controller
{
    /**
     * List all prefixes (for dropdown when creating disbursement).
     */
    public function index(Request $request): JsonResponse
    {
        $prefixes = ControlNumberPrefix::query()
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get(['id', 'code', 'label', 'sort_order']);

        return response()->json(['data' => $prefixes]);
    }

    /**
     * Store a new prefix (accounting head only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'  => 'required|string|max:20|unique:control_number_prefixes,code',
            'label' => 'nullable|string|max:255',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['sort_order'] = ControlNumberPrefix::max('sort_order') + 1;

        $prefix = ControlNumberPrefix::create($validated);

        return response()->json($prefix, 201);
    }

    /**
     * Update a prefix (accounting head only).
     */
    public function update(Request $request, ControlNumberPrefix $controlNumberPrefix): JsonResponse
    {
        $validated = $request->validate([
            'code'  => 'sometimes|string|max:20|unique:control_number_prefixes,code,' . $controlNumberPrefix->id,
            'label' => 'nullable|string|max:255',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $controlNumberPrefix->update($validated);

        return response()->json($controlNumberPrefix);
    }

    /**
     * Delete a prefix (accounting head only).
     */
    public function destroy(ControlNumberPrefix $controlNumberPrefix): JsonResponse
    {
        $controlNumberPrefix->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
