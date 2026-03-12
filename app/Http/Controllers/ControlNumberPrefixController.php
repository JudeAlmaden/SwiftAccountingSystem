<?php

namespace App\Http\Controllers;

use App\Models\ControlNumberPrefix;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ControlNumberPrefixController extends Controller
{
    /**
     * Render the Inertia page with all prefixes as props.
     */
    public function index(Request $request)
    {
        $prefixes = ControlNumberPrefix::query()
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get(['id', 'code', 'label', 'sort_order']);

        if ($request->wantsJson()) {
            return response()->json(['data' => $prefixes]);
        }

        return Inertia::render('control-number-prefixes/index', [
            'prefixes' => $prefixes,
        ]);
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

        if ($request->wantsJson()) {
            return response()->json($prefix, 201);
        }

        return redirect()->route('control-number-prefixes.index')
            ->with('message', 'Prefix created successfully.');
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

        if ($request->wantsJson()) {
            return response()->json($controlNumberPrefix);
        }

        return redirect()->route('control-number-prefixes.index')
            ->with('message', 'Prefix updated successfully.');
    }

    /**
     * Delete a prefix (accounting head only).
     */
    public function destroy(ControlNumberPrefix $controlNumberPrefix): JsonResponse
    {
        $controlNumberPrefix->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Deleted']);
        }

        return redirect()->route('control-number-prefixes.index')
            ->with('message', 'Prefix deleted.');
    }
}
