<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class BalanceSheetController extends Controller
{
    public function index(Request $request)
    {
        // Default to today
        $endDate = $request->input('end_date', now()->toDateString());

        $data = $this->computeData($endDate);

        if ($request->wantsJson()) {
            return response()->json(['data' => $data]);
        }

        return Inertia::render('reports/BalanceSheet', [
            'balanceSheetData' => $data,
            'filters'          => [
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function getData(Request $request)
    {
        $endDate = $request->input('end_date');

        return response()->json(['data' => $this->computeData($endDate)]);
    }

    private function computeData(?string $endDate): array
    {
        if (!$endDate) {
            return [];
        }

        // Balance Sheet typically includes Assets, Liabilities, and Equity
        // We also need to calculate Retained Earnings (Net Income)
        
        $accounts = Account::with('group')
            ->whereIn('account_type', ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'])
            ->get()
            ->map(function ($account) use ($endDate) {
                $debit = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.status', 'approved')
                    ->where('journal_items.account_id', $account->id)
                    ->where('journal_items.type', 'debit')
                    ->where('journals.created_at', '<=', $endDate . ' 23:59:59')
                    ->sum('journal_items.amount');

                $credit = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.status', 'approved')
                    ->where('journal_items.account_id', $account->id)
                    ->where('journal_items.type', 'credit')
                    ->where('journals.created_at', '<=', $endDate . ' 23:59:59')
                    ->sum('journal_items.amount');

                $account->total_debit  = $debit;
                $account->total_credit = $credit;
                
                // Calculate balance based on account type
                if (in_array($account->account_type, ['Assets', 'Expenses'])) {
                    $account->balance = round($debit - $credit, 2);
                } else {
                    $account->balance = round($credit - $debit, 2);
                }

                return $account;
            });

        // Filter out zero balance accounts unless they are Assets, Liabilities, or Equity
        $accountsWithBalances = $accounts->filter(fn ($a) => abs($a->balance) > 0.001);

        // Separate Revenue and Expenses to calculate Net Income
        $revenue = round($accountsWithBalances->where('account_type', 'Revenue')->sum('balance'), 2);
        $expenses = round($accountsWithBalances->where('account_type', 'Expenses')->sum('balance'), 2);
        $netIncome = round($revenue - $expenses, 2);

        // Filter only Balance Sheet accounts
        $balanceSheetAccounts = $accountsWithBalances->whereIn('account_type', ['Assets', 'Liabilities', 'Equity']);

        $typeOrder = [
            'Assets'      => 1,
            'Liabilities' => 2,
            'Equity'      => 3,
        ];

        $subTypeOrder = [
            'Current Assets'          => 1, 'Non-Current Assets'       => 2, 'Contra Assets'            => 3,
            'Current Liabilities'     => 1, 'Non-Current Liabilities'  => 2, 'Contingent Liabilities'   => 3,
            'Capital'                 => 1, 'Retained Earnings'        => 2, 'Contra Equity'            => 3,
        ];

        $sorted = $balanceSheetAccounts->sortBy(function ($account) use ($typeOrder, $subTypeOrder) {
            $typeRank    = $typeOrder[$account->account_type]    ?? 99;
            $subTypeRank = $subTypeOrder[$account->sub_account_type] ?? 99;
            $groupCode   = $account->group ? $account->group->grp_code : '';
            return sprintf('%02d-%02d-%s-%s', $typeRank, $subTypeRank, $groupCode, $account->account_code);
        });

        $finalData = $sorted->values()->toArray();

        // Add Net Income as a virtual account if it's non-zero
        if (abs($netIncome) > 0.001) {
            $finalData[] = [
                'id' => 0,
                'account_name' => 'Net Income (Loss)',
                'account_code' => 'NET-INC',
                'account_description' => 'Calculated Net Income for the period',
                'account_type' => 'Equity',
                'sub_account_type' => 'Retained Earnings',
                'balance' => $netIncome,
                'total_debit' => $netIncome > 0 ? 0 : abs($netIncome),
                'total_credit' => $netIncome > 0 ? $netIncome : 0,
                'group' => [
                    'id' => 0,
                    'name' => 'Calculated Totals',
                    'grp_code' => 'NET',
                ]
            ];
        }

        return $finalData;
    }
}
