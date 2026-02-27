<?php

namespace App\Http\Controllers;

use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\JournalTracking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JournalReportController extends Controller
{
    /**
     * Return aggregated journal report data (for API).
     * Supports period (daily|monthly|yearly) and date range.
     * Requires "view journals" permission.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period'    => 'nullable|string|in:daily,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date|after_or_equal:date_from',
            'type'      => 'nullable|string|in:journal,disbursement,all',
        ]);

        $period   = $validated['period']    ?? 'monthly';
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo   = $validated['date_to']   ?? null;
        $type     = $validated['type']      ?? 'all';

        if (!$dateFrom) {
            $dateFrom = now()->startOfYear()->toDateString();
        }
        if (!$dateTo) {
            $dateTo = now()->toDateString();
        }

        $journalQuery = Journal::query()
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        if ($type !== 'all') {
            $journalQuery->where('type', $type);
        }

        $itemsBaseQuery = JournalItem::query()
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->whereDate('journals.created_at', '>=', $dateFrom)
            ->whereDate('journals.created_at', '<=', $dateTo)
            ->select('journal_items.*', 'journals.created_at as journal_created_at', 'journals.status as journal_status');

        if ($type !== 'all') {
            $itemsBaseQuery->where('journals.type', $type);
        }

        // --- Per-voucher amounts (credit sum = voucher amount) ---
        $voucherAmountsQuery = JournalItem::query()
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->whereDate('journals.created_at', '>=', $dateFrom)
            ->whereDate('journals.created_at', '<=', $dateTo)
            ->where('journal_items.type', 'credit');

        if ($type !== 'all') {
            $voucherAmountsQuery->where('journals.type', $type);
        }

        $voucherAmountsAll = (clone $voucherAmountsQuery)
            ->groupBy('journals.id', 'journals.control_number', 'journals.created_at', 'journals.status')
            ->select(
                'journals.id',
                'journals.control_number',
                'journals.created_at',
                'journals.status',
                DB::raw('SUM(journal_items.amount) as voucher_amount')
            )
            ->get();

        $voucherAmountsApproved = $voucherAmountsAll->where('status', 'approved');

        $pendingTotal   = $voucherAmountsAll->where('status', 'pending')->sum('voucher_amount');
        $approvedTotal  = $voucherAmountsApproved->sum('voucher_amount');
        $rejectedTotal  = $voucherAmountsAll->where('status', 'rejected')->sum('voucher_amount');
        $totalDisbursed = round($approvedTotal, 2);
        $totalVouchers  = $voucherAmountsAll->count();
        $approvedCount  = $voucherAmountsApproved->count();
        $pendingCount   = $voucherAmountsAll->where('status', 'pending')->count();
        $rejectedCount  = $voucherAmountsAll->where('status', 'rejected')->count();

        $largestVoucher = $voucherAmountsApproved->sortByDesc('voucher_amount')->first();
        $avgAmountPerVoucher = $approvedCount > 0 ? round($approvedTotal / $approvedCount, 2) : 0;

        // --- Summary counts ---
        $byStatus = (clone $journalQuery)->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $summaryCounts = [
            'total'                  => (clone $journalQuery)->count(),
            'pending'                => (int) ($byStatus['pending'] ?? 0),
            'approved'               => (int) ($byStatus['approved'] ?? 0),
            'rejected'               => (int) ($byStatus['rejected'] ?? 0),
            'total_debit'            => 0,
            'total_credit'           => 0,
            'total_expense'          => 0,
            'total_disbursed'        => $totalDisbursed,
            'total_approved_amount'  => $totalDisbursed,
            'pending_total_amount'   => round($pendingTotal, 2),
            'approved_total_amount'  => round($approvedTotal, 2),
            'rejected_total_amount'  => round($rejectedTotal, 2),
            'total_vouchers'         => $totalVouchers,
            'largest_voucher_amount' => $largestVoucher ? round((float) $largestVoucher->voucher_amount, 2) : 0,
            'largest_voucher_ref'    => $largestVoucher?->control_number,
            'largest_voucher_date'   => $largestVoucher?->created_at?->format('Y-m-d'),
            'avg_disbursement_per_voucher' => $avgAmountPerVoucher,
        ];

        // --- Item-based totals ---
        $totalsAll = (clone $itemsBaseQuery)
            ->select(
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'debit' THEN journal_items.amount ELSE 0 END), 0) as total_debit"),
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'credit' THEN journal_items.amount ELSE 0 END), 0) as total_credit")
            )
            ->first();
        $summaryCounts['total_debit']  = round((float) ($totalsAll?->total_debit ?? 0), 2);
        $summaryCounts['total_credit'] = round((float) ($totalsAll?->total_credit ?? 0), 2);
        $totalsApproved = (clone $itemsBaseQuery)->where('journals.status', 'approved')
            ->select(
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'debit' THEN journal_items.amount ELSE 0 END), 0) as total_debit"),
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'credit' THEN journal_items.amount ELSE 0 END), 0) as total_credit")
            )
            ->first();
        $summaryCounts['total_expense'] = round((float) ($totalsApproved?->total_debit ?? 0), 2);

        // --- Daily trend ---
        $from     = Carbon::parse($dateFrom);
        $to       = Carbon::parse($dateTo);
        $daysDiff = $from->diffInDays($to) + 1;
        $prevTo   = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($daysDiff - 1);

        $dailyRows = $voucherAmountsAll->groupBy(fn ($v) => Carbon::parse($v->created_at)->format('Y-m-d'))
            ->map(function ($vouchers, $date) {
                $pendingAmt  = $vouchers->where('status', 'pending')->sum('voucher_amount');
                $approvedAmt = $vouchers->where('status', 'approved')->sum('voucher_amount');
                $rejectedAmt = $vouchers->where('status', 'rejected')->sum('voucher_amount');
                return [
                    'date'            => $date,
                    'total_disbursed' => round($approvedAmt, 2),
                    'pending_amount'  => round($pendingAmt, 2),
                    'approved_amount' => round($approvedAmt, 2),
                    'rejected_amount' => round($rejectedAmt, 2),
                    'vouchers'        => $vouchers->count(),
                ];
            })
            ->sortKeys()
            ->values()
            ->all();

        $prevPeriodQuery = JournalItem::query()
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->whereDate('journals.created_at', '>=', $prevFrom->toDateString())
            ->whereDate('journals.created_at', '<=', $prevTo->toDateString())
            ->where('journal_items.type', 'credit')
            ->where('journals.status', 'approved');

        if ($type !== 'all') {
            $prevPeriodQuery->where('journals.type', $type);
        }

        $prevPeriodVouchers = $prevPeriodQuery->sum('journal_items.amount');
        $currentPeriodDisbursed = $totalDisbursed;
        $pctChange = $prevPeriodVouchers > 0
            ? round((($currentPeriodDisbursed - $prevPeriodVouchers) / $prevPeriodVouchers) * 100, 1)
            : ($currentPeriodDisbursed > 0 ? 100 : 0);

        $daily_trend = [
            'rows'                  => $dailyRows,
            'previous_period_total' => round($prevPeriodVouchers, 2),
            'current_period_total'  => $currentPeriodDisbursed,
            'pct_change'            => $pctChange,
        ];

        // --- By period ---
        $itemsForPeriod = (clone $itemsBaseQuery)->get()
            ->map(fn ($item) => (object) [
                'date'           => $item->journal_created_at,
                'type'           => $item->type,
                'amount'         => (float) $item->amount,
                'journal_status' => $item->journal_status,
            ]);
        $formatByPeriod = match ($period) {
            'daily'  => fn ($d) => $d->format('Y-m-d'),
            'yearly' => fn ($d) => $d->format('Y'),
            default  => fn ($d) => $d->format('Y-m'),
        };
        $byPeriod = $itemsForPeriod
            ->groupBy(fn ($i) => $formatByPeriod(Carbon::parse($i->date)))
            ->map(function ($items) {
                $approvedCredit = $items->where('journal_status', 'approved')->where('type', 'credit')->sum('amount');
                return [
                    'total_debit'    => round($items->where('type', 'debit')->sum('amount'), 2),
                    'total_credit'   => round($items->where('type', 'credit')->sum('amount'), 2),
                    'total_expense'  => round($items->where('journal_status', 'approved')->where('type', 'debit')->sum('amount'), 2),
                    'total_disbursed' => round($approvedCredit, 2),
                    'count'          => $items->pluck('journal_id')->unique()->count(),
                ];
            });

        // --- Top accounts (approved only) ---
        $topAccountsQuery = JournalItem::query()
            ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->whereDate('journals.created_at', '>=', $dateFrom)
            ->whereDate('journals.created_at', '<=', $dateTo)
            ->where('journals.status', 'approved')
            ->where('journal_items.type', 'credit');

        if ($type !== 'all') {
            $topAccountsQuery->where('journals.type', $type);
        }

        $topAccountsRaw = $topAccountsQuery
            ->groupBy('accounts.id', 'accounts.account_code', 'accounts.account_name', 'accounts.account_type')
            ->select(
                'accounts.id as account_id',
                'accounts.account_code',
                'accounts.account_name',
                'accounts.account_type',
                DB::raw('SUM(journal_items.amount) as total_disbursed'),
                DB::raw('COUNT(DISTINCT journals.id) as vouchers')
            )
            ->get();

        $topAccountsTotal = $topAccountsRaw->sum('total_disbursed');
        $top_accounts = $topAccountsRaw
            ->map(fn ($row, $i) => [
                'rank'           => $i + 1,
                'account_id'     => $row->account_id,
                'account_code'   => $row->account_code,
                'account_name'   => $row->account_name,
                'account_type'   => $row->account_type,
                'total_disbursed' => round((float) $row->total_disbursed, 2),
                'vouchers'       => (int) $row->vouchers,
                'pct_of_total'   => $topAccountsTotal > 0 ? round(((float) $row->total_disbursed / $topAccountsTotal) * 100, 1) : 0,
            ])
            ->sortByDesc('total_disbursed')
            ->values()
            ->map(fn ($row, $i) => array_merge($row, ['rank' => $i + 1]))
            ->values()
            ->all();

        // --- By account (all statuses) ---
        $byAccountRows = (clone $itemsBaseQuery)
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->select(
                'journal_items.account_id',
                'accounts.account_name',
                'accounts.account_code',
                'accounts.account_type',
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'debit' THEN journal_items.amount ELSE 0 END), 0) as total_debit"),
                DB::raw("COALESCE(SUM(CASE WHEN journal_items.type = 'credit' THEN journal_items.amount ELSE 0 END), 0) as total_credit")
            )
            ->groupBy('journal_items.account_id', 'accounts.account_name', 'accounts.account_code', 'accounts.account_type')
            ->get();
        $byAccount = $byAccountRows->map(fn ($row) => [
            'account_id'   => $row->account_id,
            'account_name' => $row->account_name,
            'account_code' => $row->account_code,
            'account_type' => $row->account_type,
            'total_debit'  => round((float) $row->total_debit, 2),
            'total_credit' => round((float) $row->total_credit, 2),
            'total'        => round((float) $row->total_debit + (float) $row->total_credit, 2),
        ])->values()->all();

        $ranking = collect($byAccount)->sortByDesc('total_debit')->values()->map(fn ($row, $index) => array_merge($row, ['rank' => $index + 1]))->all();

        // --- Voucher-level details ---
        $vouchersForList = (clone $journalQuery)
            ->where('status', 'approved')
            ->with(['items.account', 'tracking' => fn ($q) => $q->orderByDesc('acted_at')->with('handler')])
            ->orderByDesc('created_at')
            ->get();

        $voucherAmountsById = $voucherAmountsApproved->keyBy('id');
        $voucher_details = $vouchersForList->map(function ($j) use ($voucherAmountsById) {
            $amount     = $voucherAmountsById->get($j->id);
            $voucherAmt = $amount ? (float) $amount->voucher_amount : 0;
            $approval   = $j->tracking->where('action', 'approved')->sortByDesc('acted_at')->first();
            $actedAt    = $approval?->acted_at;
            $created    = $j->created_at;
            $pendingDays   = $actedAt ? $created->diffInDays($actedAt) : $created->diffInDays(now());
            $approverName  = $approval && $approval->handler ? $approval->handler->name : '–';
            $firstAccount  = $j->items->first()?->account;
            $accountLabel  = $firstAccount ? "{$firstAccount->account_code} {$firstAccount->account_name}" : '–';
            return [
                'id'             => $j->id,
                'control_number' => $j->control_number,
                'date'           => $j->created_at->format('Y-m-d'),
                'account'        => $accountLabel,
                'amount'         => round($voucherAmt, 2),
                'status'         => $j->status,
                'approver'       => $approverName,
                'pending_days'   => $pendingDays,
                'remarks'        => $j->description ?: ($approval?->remarks ?: '–'),
            ];
        })->values()->all();

        // --- Workflow insights ---
        $approvedVouchers = $vouchersForList->where('status', 'approved');
        $approvalDays = [];
        foreach ($approvedVouchers as $j) {
            $approval = $j->tracking->where('action', 'approved')->sortByDesc('acted_at')->first();
            if ($approval && $approval->acted_at) {
                $approvalDays[] = $j->created_at->diffInDays($approval->acted_at);
            }
        }
        $pendingVouchers = $vouchersForList->where('status', 'pending');
        $maxDaysPending  = $pendingVouchers->isEmpty()
            ? (count($approvalDays) > 0 ? max($approvalDays) : 0)
            : $pendingVouchers->max(fn ($j) => $j->created_at->diffInDays(now()));

        $workflow = [
            'pending_pct'           => $totalVouchers > 0 ? round(($pendingCount / $totalVouchers) * 100, 1) : 0,
            'rejected_pct'          => $totalVouchers > 0 ? round(($rejectedCount / $totalVouchers) * 100, 1) : 0,
            'approved_pct'          => $totalVouchers > 0 ? round(($approvedCount / $totalVouchers) * 100, 1) : 0,
            'avg_days_to_approve'   => count($approvalDays) > 0 ? round(array_sum($approvalDays) / count($approvalDays), 1) : 0,
            'max_days_pending'      => (int) $maxDaysPending,
            'vouchers_above_100k'   => $voucherAmounts->filter(fn ($v) => (float) $v->voucher_amount > 100000)->count(),
        ];

        $journalsByPeriod = (clone $journalQuery)
            ->get(['created_at', 'status'])
            ->groupBy(fn ($j) => $formatByPeriod($j->created_at))
            ->map(fn ($items) => [
                'pending'  => $items->where('status', 'pending')->count(),
                'approved' => $items->where('status', 'approved')->count(),
                'rejected' => $items->where('status', 'rejected')->count(),
                'total'    => $items->count(),
            ]);

        return response()->json([
            'period'       => $period,
            'date_from'    => $dateFrom,
            'date_to'      => $dateTo,
            'summary'      => $summaryCounts,
            'metrics_table' => [
                ['metric' => 'Total Disbursed',   'amount' => $totalDisbursed,        'notes' => 'Only fully approved vouchers'],
                ['metric' => 'Total Vouchers',    'amount' => $totalVouchers,          'notes' => 'Count'],
                ['metric' => 'Pending / Approved / Rejected', 'amount' => "{$pendingCount} / {$approvedCount} / {$rejectedCount}", 'notes' => 'Count by status'],
                ['metric' => 'Largest Voucher',   'amount' => $summaryCounts['largest_voucher_amount'], 'notes' => $summaryCounts['largest_voucher_ref'] ? ($summaryCounts['largest_voucher_ref'] . ' · ' . $summaryCounts['largest_voucher_date']) : '–'],
                ['metric' => 'Average Amount per Voucher', 'amount' => $avgAmountPerVoucher, 'notes' => 'Helps spot unusually large/small vouchers'],
            ],
            'daily_trend'  => $daily_trend,
            'top_accounts' => $top_accounts,
            'by_period'    => $byPeriod,
            'by_account'   => $byAccount,
            'account_ranking_by_expense' => $ranking,
            'voucher_details'            => $voucher_details,
            'workflow'                   => $workflow,
            'disbursements_by_period'    => $journalsByPeriod, // key kept for frontend compatibility
        ]);
    }
}
