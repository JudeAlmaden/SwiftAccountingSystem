<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Show the dashboard with aggregated stats and a simple report.
     */
    public function __invoke(Request $request)
    {
        $journalsByStatus = Journal::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $pending = (int) ($journalsByStatus['pending'] ?? 0);
        $approved = (int) ($journalsByStatus['approved'] ?? 0);
        $rejected = (int) ($journalsByStatus['rejected'] ?? 0);
        $totalJournals = $pending + $approved + $rejected;

        $totalApprovedAmount = (float) JournalItem::query()
            ->whereHas('journal', fn ($q) => $q->where('status', 'approved'))
            ->where('type', 'credit')
            ->sum('amount');

        $stats = [
            'disbursements' => [
                'total' => $totalJournals,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'total_approved_amount' => round($totalApprovedAmount, 2),
            ],
            'users' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
            ],
            'accounts' => [
                'total' => Account::count(),
                'active' => Account::where('status', 'active')->count(),
            ],
        ];

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    }
}
