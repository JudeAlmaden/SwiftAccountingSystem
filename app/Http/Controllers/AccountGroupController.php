<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AccountGroup;
use App\Models\Account;

class AccountGroupController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string',
            'account_type' => 'nullable|string',
            'all' => 'nullable' // Accept any value for 'all' parameter
        ]);

        $query = AccountGroup::query()->withCount('accounts');

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('grp_code', 'like', "%{$search}%");
            });
        }

        if (!empty($validated['account_type'])) {
            $query->where('account_type', $validated['account_type']);
        }

        // Check if 'all' parameter exists (regardless of value)
        if ($request->has('all')) {
            return response()->json(['data' => $query->orderBy('name')->get()]);
        }

        $groups = $query->orderBy('name')->paginate(20);
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grp_code' => 'nullable|string|max:50',
            'account_type' => 'required|in:Assets,Liabilities,Equity,Revenue,Expenses',
            'sub_account_type' => 'nullable|string|max:255'
        ]);

        $group = AccountGroup::create($validated);
        return response()->json($group);
    }

    public function show($id) {
        return response()->json(AccountGroup::with('accounts')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
         $validated = $request->validate([
            'name' => 'required|string|max:255',
            'grp_code' => 'nullable|string|max:50',
            'account_type' => 'required|in:Assets,Liabilities,Equity,Revenue,Expenses',
            'sub_account_type' => 'nullable|string|max:255'
        ]);

        $group = AccountGroup::findOrFail($id);
        $group->update($validated);
        return response()->json($group);
    }

    public function destroy($id)
    {
        $group = AccountGroup::withCount('accounts')->findOrFail($id);
        if ($group->accounts_count > 0) {
            return response()->json(['message' => 'Cannot delete group with associated accounts.'], 422);
        }
        $group->delete();
        return response()->json(['message' => 'Group deleted.']);
    }
}
