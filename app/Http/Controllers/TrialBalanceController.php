<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TrialBalanceController extends Controller
{
    public function index(Request $request)
    {
        // Default to current month
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date', now()->toDateString());

        $data = $this->computeData($startDate, $endDate);

        if ($request->wantsJson()) {
            return response()->json(['data' => $data]);
        }

        return Inertia::render('reports/TrialBalance', [
            'trialBalanceData' => $data,
            'filters'          => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

    public function getData(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        return response()->json(['data' => $this->computeData($startDate, $endDate)]);
    }

    private function computeData(?string $startDate, ?string $endDate): array
    {
        if (!$startDate || !$endDate) {
            return [];
        }

        $accounts = Account::with('group')
            ->get()
            ->map(function ($account) use ($startDate, $endDate) {
                $debit = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.status', 'approved')
                    ->where('journal_items.account_id', $account->id)
                    ->where('journal_items.type', 'debit')
                    ->whereBetween('journals.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('journal_items.amount');

                $credit = DB::table('journal_items')
                    ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                    ->where('journals.status', 'approved')
                    ->where('journal_items.account_id', $account->id)
                    ->where('journal_items.type', 'credit')
                    ->whereBetween('journals.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->sum('journal_items.amount');

                $account->total_debit  = $debit;
                $account->total_credit = $credit;

                return $account;
            });

        $typeOrder = [
            'Assets'      => 1,
            'Liabilities' => 2,
            'Equity'      => 3,
            'Revenue'     => 4,
            'Expenses'    => 5,
        ];

        $subTypeOrder = [
            'Current Assets'          => 1, 'Non-Current Assets'       => 2, 'Contra Assets'            => 3,
            'Current Liabilities'     => 1, 'Non-Current Liabilities'  => 2, 'Contingent Liabilities'   => 3,
            'Capital'                 => 1, 'Retained Earnings'        => 2, 'Contra Equity'            => 3,
            'Operating Revenue'       => 1, 'Non-Operating Revenue'    => 2, 'Contra Revenue'           => 3,
            'Operating Expenses'      => 1, 'Non-Operating Expenses'   => 2, 'Cost of Goods Sold'       => 3, 'Contra Expenses' => 4,
        ];

        $accountsWithTransactions = $accounts->filter(fn ($a) => $a->total_debit > 0 || $a->total_credit > 0);

        $sorted = $accountsWithTransactions->sortBy(function ($account) use ($typeOrder, $subTypeOrder) {
            $typeRank    = $typeOrder[$account->account_type]    ?? 99;
            $subTypeRank = $subTypeOrder[$account->sub_account_type] ?? 99;
            $groupCode   = $account->group ? $account->group->grp_code : '';
            return sprintf('%02d-%02d-%s-%s', $typeRank, $subTypeRank, $groupCode, $account->account_code);
        });

        return $sorted->values()->toArray();
    }
}
