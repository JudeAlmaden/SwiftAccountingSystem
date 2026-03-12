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
            'all' => 'nullable'
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

        if ($request->wantsJson()) {
            if ($request->has('all')) {
                return response()->json(['data' => $query->orderBy('name')->get()]);
            }
            return response()->json($query->orderBy('name')->paginate(20));
        }

        // For Inertia, we suggest using AccountsController@index, 
        // but if they hit this, redirect to chart of accounts
        return redirect()->route('accounts.index', ['tab' => 'groups']);
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

        if ($request->wantsJson()) {
            return response()->json($group);
        }

        return redirect()->route('accounts.index', ['tab' => 'groups'])
            ->with('message', 'Account group created successfully.');
    }

    public function show($id) {
        $group = AccountGroup::with('accounts')->findOrFail($id);
        if (request()->wantsJson()) {
            return response()->json($group);
        }
        return redirect()->route('accounts.index', ['tab' => 'groups']);
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

        if ($request->wantsJson()) {
            return response()->json($group);
        }

        return redirect()->route('accounts.index', ['tab' => 'groups'])
            ->with('message', 'Account group updated successfully.');
    }

    public function destroy($id)
    {
        $group = AccountGroup::withCount('accounts')->findOrFail($id);
        if ($group->accounts_count > 0) {
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Cannot delete group with associated accounts.'], 422);
            }
            return back()->withErrors(['message' => 'Cannot delete group with associated accounts.']);
        }

        $group->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Group deleted.']);
        }

        return redirect()->route('accounts.index', ['tab' => 'groups'])
            ->with('message', 'Account group deleted successfully.');
    }
}
