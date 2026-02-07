<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Disbursement;
use App\Models\DisbursementItem;
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
        $disbursementsByStatus = Disbursement::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $pending = (int) ($disbursementsByStatus['pending'] ?? 0);
        $approved = (int) ($disbursementsByStatus['approved'] ?? 0);
        $rejected = (int) ($disbursementsByStatus['rejected'] ?? 0);
        $totalDisbursements = $pending + $approved + $rejected;

        $totalApprovedAmount = (float) DisbursementItem::query()
            ->whereHas('disbursement', fn ($q) => $q->where('status', 'approved'))
            ->where('type', 'credit')
            ->sum('amount');

        $stats = [
            'disbursements' => [
                'total' => $totalDisbursements,
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
