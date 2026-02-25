<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\JournalItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountReportController extends Controller
{
    /**
     * Return aggregated account (chart of accounts) report data (for API).
     * Optional period and date range to scope usage and amounts.
     * Requires "view accounts" permission.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period'    => 'nullable|string|in:daily,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
        ]);

        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $period = $validated['period'] ?? 'monthly';

        $byStatus = Account::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $byType = Account::query()
            ->selectRaw('account_type, count(*) as count')
            ->groupBy('account_type')
            ->pluck('count', 'account_type')
            ->all();

        $itemsQuery = JournalItem::query()
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id');

        if ($dateFrom) {
            $itemsQuery->whereDate('journals.created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $itemsQuery->whereDate('journals.created_at', '<=', $dateTo);
        }

        $usageAndAmounts = (clone $itemsQuery)
            ->select(
                'journal_items.account_id',
                DB::raw('count(*) as usage_count'),
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'debit' THEN journal_items.amount ELSE 0 END), 0) as total_debit"),
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'credit' THEN journal_items.amount ELSE 0 END), 0) as total_credit")
            )
            ->groupBy('journal_items.account_id')
            ->get()
            ->keyBy('account_id');

        $accountsWithUsage = Account::query()
            ->get(['id', 'account_name', 'account_code', 'account_type', 'status'])
            ->map(function ($account) use ($usageAndAmounts) {
                $row = $usageAndAmounts->get($account->id);
                return [
                    'id'            => $account->id,
                    'account_name'  => $account->account_name,
                    'account_code'  => $account->account_code,
                    'account_type'  => $account->account_type,
                    'status'        => $account->status,
                    'usage_count'   => (int) ($row->usage_count ?? 0),
                    'total_debit'   => round((float) ($row->total_debit ?? 0), 2),
                    'total_credit'  => round((float) ($row->total_credit ?? 0), 2),
                ];
            });

        return response()->json([
            'period'    => $period,
            'date_from' => $dateFrom,
            'date_to'   => $dateTo,
            'summary'   => [
                'total'    => Account::count(),
                'active'   => (int) ($byStatus['active'] ?? 0),
                'inactive' => (int) ($byStatus['inactive'] ?? 0),
                'by_type'  => $byType,
            ],
            'accounts_with_usage' => $accountsWithUsage,
        ]);
    }
}
