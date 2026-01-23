<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;

class ChartOfAccountsController extends Controller
{
    /**
    * List all chart of accounts
    **/
    function index(Request $request){
        $validated = $request->validate([
            'search' => 'nullable|string',
            'page'   => 'nullable|integer|min:1',
            'limit'  => 'nullable|integer|min:1|max:15',
        ]);
        $account = Account::get()
        ->when($validated['account_name'] ?? null, fn ($q, $search) =>
            $q->where('account_name', 'like', "%{$search}%")
        )
        ->when($validated['page'] ?? null, fn ($q, $page) =>
            $q->paginate($validated['limit'] ?? 15, ['*'], 'page', $page)
        );

        return response()->json($account);
    }

    /**
    * Create a new chart of account
    **/
    function store(Request $request){
        $validated = $request->validate([
            'account_name' => 'required|string|max:255|unique:accounts,account_name',
            'account_description' => 'nullable|string',
            'account_code' => 'required|string|max:255|unique:accounts,account_code',
            'account_type' => 'required|string|max:255',
        ]);

        $account = Account::create($validated);
        return response()->json($account);
    }

    /** 
    * Delete a chart an account from the chart, 
    * WE WILL ONLY DO THIS IF THE ACCOUNT IS NOT ASSIGNED TO ANY TRANSACTION
    **/
    function destroy($id){
        $account = Account::find($id);

        /** 
         * Check if the account is assigned to any transaction
         * If it is, return an error
         * REMINDER TO IMPLEMENT THIS
        **/
        if (!$account) {
            return response()->json([
                'message' => 'Account not found',
            ], 404);
        }
        $account->delete();
        return response()->json([
            'message' => 'Account deleted successfully',
        ], 200);
    }
}
