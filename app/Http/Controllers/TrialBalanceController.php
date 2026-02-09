<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Disbursement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TrialBalanceController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/TrialBalance');
    }

    public function getData(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if (!$startDate || !$endDate) {
            return response()->json(['data' => []]);
        }

        // Get all accounts with their sum of debits and credits from APPROVED disbursements
        // within the date range.
        
        $accounts = Account::with('group')
            ->get()
            ->map(function ($account) use ($startDate, $endDate) {
                // Calculate Debits
                $debit = DB::table('disbursement_items')
                    ->join('disbursements', 'disbursement_items.disbursement_id', '=', 'disbursements.id')
                    ->where('disbursements.status', 'approved')
                    ->where('disbursement_items.account_id', $account->id)
                    ->where('disbursement_items.type', 'debit')
                    ->whereBetween('disbursements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('disbursement_items.amount');

                // Calculate Credits
                $credit = DB::table('disbursement_items')
                    ->join('disbursements', 'disbursement_items.disbursement_id', '=', 'disbursements.id')
                    ->where('disbursements.status', 'approved')
                    ->where('disbursement_items.account_id', $account->id)
                    ->where('disbursement_items.type', 'credit')
                    ->whereBetween('disbursements.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('disbursement_items.amount');

                $account->total_debit = $debit;
                $account->total_credit = $credit;
                
                return $account;
            });

        // Define the sorting order
        $typeOrder = [
            'Assets' => 1,
            'Liabilities' => 2,
            'Equity' => 3,
            'Revenue' => 4,
            'Expenses' => 5,
        ];

        $subTypeOrder = [
            // Assets
            'Current Assets' => 1,
            'Non-Current Assets' => 2,
            'Contra Assets' => 3,
            
            // Liabilities
            'Current Liabilities' => 1,
            'Non-Current Liabilities' => 2,
            'Contingent Liabilities' => 3,

            // Equity
            'Capital' => 1,
            'Retained Earnings' => 2,
            'Contra Equity' => 3,

            // Revenue
            'Operating Revenue' => 1,
            'Non-Operating Revenue' => 2,
            'Contra Revenue' => 3,

            // Expenses
            'Operating Expenses' => 1,
            'Non-Operating Expenses' => 2,
            'Cost of Goods Sold' => 3,
            'Contra Expenses' => 4,
        ];

        // Filter out accounts with zero balance if desired? Usually Trial Balance shows all or active.
        // The user said "table of all accounts". I will keep all.

        $sortedAccounts = $accounts->sortBy(function ($account) use ($typeOrder, $subTypeOrder) {
            $typeRank = $typeOrder[$account->account_type] ?? 99;
            $subTypeRank = $subTypeOrder[$account->sub_account_type] ?? 99;
            $groupCode = $account->group ? $account->group->grp_code : '';
            
            // Convert to a string for comparison or array
            // We want primary sort by Type, then SubType, then Group Code, then Account Code
            return sprintf('%02d-%02d-%s-%s', $typeRank, $subTypeRank, $groupCode, $account->account_code);
        });

        return response()->json([
            'data' => $sortedAccounts->values()
        ]);
    }
}
