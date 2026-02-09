<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;

class AccountsController extends Controller
{
    /**
    * List all chart of accounts
    **/
    function index(Request $request){
        $validated = $request->validate([
            'search' => 'nullable|string',
            'page'   => 'nullable|integer|min:1',
            'limit'  => 'nullable|integer|min:1|max:1000',
            'all'    => 'nullable',
            'account_group_id' => 'nullable|exists:account_groups,id'
        ]);
        $query = Account::query()->withCount('disbursementItems')->with('group');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                  ->orWhere('account_code', 'like', "%{$search}%");
            });
        }
        
        if (!empty($validated['account_group_id'])) {
            $query->where('account_group_id', $validated['account_group_id']);
        }

        if ($request->boolean('all')) {
            // For optimized dropdowns, we usually only want active accounts
            $accounts = $query->where('status', 'active')->get();
            return response()->json(['data' => $accounts]);
        }

        $accounts = $query->paginate($validated['limit'] ?? 15);
        
        return response()->json($accounts);
    }

    /**
    * Create a new chart of account
    **/
    function store(Request $request){
        $validated = $request->validate([
            'account_name' => 'required|string|max:255|unique:accounts,account_name',
            'account_description' => 'nullable|string',
            'account_code' => 'required|string|max:255|unique:accounts,account_code',
            'account_type' => 'required|in:Assets,Liabilities,Equity,Revenue,Expenses',
            'sub_account_type' => 'nullable|string|max:255',
            'account_group_id' => 'nullable|exists:account_groups,id',
            'account_normal_side' => 'required|in:debit,credit',
        ]);

        // Validate sub_account_type against account_type
        if (!empty($validated['sub_account_type'])) {
            $validSubTypes = Account::getSubAccountTypes($validated['account_type']);
            if (empty($validSubTypes)) {
                return response()->json([
                    'message' => 'Invalid account type.',
                    'errors' => ['account_type' => ['The selected account type is invalid.']]
                ], 422);
            }
            if (!in_array($validated['sub_account_type'], $validSubTypes)) {
                return response()->json([
                    'message' => 'Invalid sub-account type for the selected account type.',
                    'errors' => ['sub_account_type' => ['The selected sub-account type is invalid for this account type.']]
                ], 422);
            }
        }

        $account = Account::create($validated);
        return response()->json($account);
    }

    /**
     * View a specific account with its disbursement history
     */
    function show(Request $request, $id)
    {
        $validated = $request->validate([
            'search' => 'nullable|string',
            'page' => 'nullable|integer|min:1',
        ]);

        $account = Account::withCount('disbursementItems')->findOrFail($id);

        // Get disbursements that reference this account
        $query = \App\Models\Disbursement::query()
            ->whereHas('items', function($q) use ($id) {
                $q->where('account_id', $id);
            })
            ->with(['items' => function($q) use ($id) {
                $q->where('account_id', $id)->with('account');
            }]);

        // Search functionality
        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('control_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $disbursements = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'account' => $account,
            'disbursements' => $disbursements,
        ]);
    }

    /** 
    * Delete a chart an account from the chart, 
    * WE WILL ONLY DO THIS IF THE ACCOUNT IS NOT ASSIGNED TO ANY TRANSACTION
    **/
    function destroy($id){
        $account = Account::withCount('disbursementItems')->find($id);

        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }

        if ($account->disbursement_items_count > 0) {
            return response()->json([
                'message' => 'Cannot delete account as it has associated disbursement items.',
            ], 422);
        }

        $account->delete();
        return response()->json([
            'message' => 'Account deleted successfully',
        ], 200);
    }

    /**
     * Toggle the status of an account
     */
    function toggleStatus($id)
    {
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $account->status = $account->status === 'active' ? 'inactive' : 'active';
        $account->save();

        return response()->json($account);
    }
}
