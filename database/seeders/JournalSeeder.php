<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\JournalTracking;
use App\Models\Account;
use App\Models\User;

class JournalSeeder extends Seeder
{
    private ?Account $cashAccount = null;
    private ?Account $bankAccount = null;
    private ?Account $rentExpense = null;
    private ?Account $accountsPayable = null;
    private ?User $assistant = null;
    private ?User $head = null;
    private ?User $admin = null;

    public function run(): void
    {
        $this->resolveDependencies();
        
        if (!$this->assistant || !$this->head || !$this->admin) {
             return;
        }

        $faker = \Faker\Factory::create();

        // --- Disbursement vouchers (with check step flow) ---
        for ($i = 1; $i <= 20; $i++) {
            $controlNumber = 'DV-2026-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $titles = ['Office Supplies', 'Rent Payment', 'Utilities', 'Equipment Purchase', 'Consultancy Fee', 'Repair Services', 'Travel Expenses', 'Software Subscription'];
            $title  = $titles[array_rand($titles)] . ' - ' . $faker->monthName;

            $amount = $faker->randomFloat(2, 1000, 50000);

            // 30% Approved, 20% Rejected, 50% Pending
            $rand         = rand(1, 100);
            $targetStatus = 'pending';
            $targetStep   = 2;

            if ($rand <= 30) {
                $targetStatus = 'approved';
                $targetStep   = 6;
            } elseif ($rand <= 50) {
                $targetStatus = 'rejected';
                $targetStep   = rand(2, 4);
            } else {
                $targetStatus = 'pending';
                $targetStep   = rand(2, 5);
            }

            $journal = Journal::create([
                'control_number' => $controlNumber,
                'type'           => 'disbursement',
                'title'          => $title,
                'description'    => $faker->sentence,
                'step_flow'      => Journal::defaultStepFlow(),
                'current_step'   => $targetStep,
                'status'         => $targetStatus,
                'check_id'       => ($targetStep >= 6) ? 'CHK-' . rand(10000, 99999) : null,
                'created_at'     => Carbon::now()->subDays(rand(1, 60)),
            ]);

            // Create Items (Balanced)
            $debitAccount  = rand(0, 1) ? $this->rentExpense : $this->accountsPayable;
            $creditAccount = rand(0, 1) ? $this->cashAccount : $this->bankAccount;

            if (rand(0, 1)) {
                $split1 = $amount * 0.6;
                $split2 = $amount - $split1;
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $debitAccount->id,      'type' => 'debit',  'amount' => $split1, 'order_number' => 1]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $this->rentExpense->id, 'type' => 'debit',  'amount' => $split2, 'order_number' => 2]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $creditAccount->id,     'type' => 'credit', 'amount' => $amount, 'order_number' => 3]);
            } else {
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $debitAccount->id,  'type' => 'debit',  'amount' => $amount, 'order_number' => 1]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $creditAccount->id, 'type' => 'credit', 'amount' => $amount, 'order_number' => 2]);
            }

            // Tracking History
            $createdTime = Carbon::parse($journal->created_at);

            JournalTracking::create([
                'journal_id' => $journal->id,
                'step'       => 1,
                'role'       => 'accounting assistant',
                'action'     => 'approved',
                'remarks'    => 'Generated and verified.',
                'handled_by' => $this->assistant->id,
                'acted_at'   => $createdTime->copy()->addHours(1),
            ]);

            if ($targetStep > 2 || ($targetStep == 2 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 2 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 2,
                    'role'       => 'accounting head',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Budget constraints.' : 'Approved.',
                    'handled_by' => $this->head->id,
                    'acted_at'   => $createdTime->copy()->addHours(5),
                ]);
            }

            if ($targetStep > 3 || ($targetStep == 3 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 3 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 3,
                    'role'       => 'auditor',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Missing docs.' : 'Audited.',
                    'handled_by' => $this->admin->id,
                    'acted_at'   => $createdTime->copy()->addDay(),
                ]);
            }

            if ($targetStep > 4 || ($targetStep == 4 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 4 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 4,
                    'role'       => 'svp',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Declined by SVP.' : 'SVP Approved.',
                    'handled_by' => $this->admin->id,
                    'acted_at'   => $createdTime->copy()->addDays(2),
                ]);
            }

            if ($targetStep > 5 || ($targetStep == 5 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 5 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 5,
                    'role'       => 'accounting assistant',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Check issue failure.' : 'Check released.',
                    'handled_by' => $this->assistant->id,
                    'acted_at'   => $createdTime->copy()->addDays(3),
                ]);
            }
        }

        // --- Journal vouchers (no check step; uses journalStepFlow) ---
        for ($i = 1; $i <= 15; $i++) {
            $controlNumber = 'JV-2026-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $titles = ['Accrual Entry', 'Adjusting Entry', 'Reclassification', 'Provision Entry', 'Depreciation Entry'];
            $title  = $titles[array_rand($titles)] . ' - ' . $faker->monthName;

            $amount = $faker->randomFloat(2, 500, 25000);

            // 50% Approved, 20% Rejected, 30% Pending
            $rand         = rand(1, 100);
            $targetStatus = 'pending';
            $targetStep   = 2;

            if ($rand <= 50) {
                $targetStatus = 'approved';
                $targetStep   = 4; // final step (svp) for journal vouchers
            } elseif ($rand <= 70) {
                $targetStatus = 'rejected';
                $targetStep   = rand(2, 4);
            } else {
                $targetStatus = 'pending';
                $targetStep   = rand(2, 4);
            }

            $journal = Journal::create([
                'control_number' => $controlNumber,
                'type'           => 'journal',
                'title'          => $title,
                'description'    => $faker->sentence,
                'step_flow'      => Journal::journalStepFlow(),
                'current_step'   => $targetStep,
                'status'         => $targetStatus,
                'created_at'     => Carbon::now()->subDays(rand(1, 60)),
            ]);

            // Create Items (Balanced)
            $debitAccount  = rand(0, 1) ? $this->rentExpense : $this->accountsPayable;
            $creditAccount = rand(0, 1) ? $this->cashAccount : $this->bankAccount;

            if (rand(0, 1)) {
                $split1 = $amount * 0.5;
                $split2 = $amount - $split1;
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $debitAccount->id,      'type' => 'debit',  'amount' => $split1, 'order_number' => 1]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $this->rentExpense->id, 'type' => 'debit',  'amount' => $split2, 'order_number' => 2]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $creditAccount->id,     'type' => 'credit', 'amount' => $amount, 'order_number' => 3]);
            } else {
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $debitAccount->id,  'type' => 'debit',  'amount' => $amount, 'order_number' => 1]);
                JournalItem::create(['journal_id' => $journal->id, 'account_id' => $creditAccount->id, 'type' => 'credit', 'amount' => $amount, 'order_number' => 2]);
            }

            $createdTime = Carbon::parse($journal->created_at);

            // Step 1: generated by accounting assistant (auto-approved on creation)
            JournalTracking::create([
                'journal_id' => $journal->id,
                'step'       => 1,
                'role'       => 'accounting assistant',
                'action'     => 'approved',
                'remarks'    => 'Journal voucher generated and recorded.',
                'handled_by' => $this->assistant->id,
                'acted_at'   => $createdTime->copy()->addHours(1),
            ]);

            if ($targetStep > 2 || ($targetStep == 2 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 2 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 2,
                    'role'       => 'accounting head',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Budget / coding issue.' : 'Reviewed by accounting head.',
                    'handled_by' => $this->head->id,
                    'acted_at'   => $createdTime->copy()->addHours(6),
                ]);
            }

            if ($targetStep > 3 || ($targetStep == 3 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 3 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 3,
                    'role'       => 'auditor',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Supporting docs insufficient.' : 'Audit trail checked.',
                    'handled_by' => $this->admin->id,
                    'acted_at'   => $createdTime->copy()->addDay(),
                ]);
            }

            if ($targetStep > 4 || ($targetStep == 4 && $targetStatus == 'rejected')) {
                $action = ($targetStep == 4 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                JournalTracking::create([
                    'journal_id' => $journal->id,
                    'step'       => 4,
                    'role'       => 'svp',
                    'action'     => $action,
                    'remarks'    => $action == 'rejected' ? 'Declined by SVP.' : 'Final approval for journal voucher.',
                    'handled_by' => $this->admin->id,
                    'acted_at'   => $createdTime->copy()->addDays(2),
                ]);
            }
        }
    }

    private function resolveDependencies(): void
    {
        $this->cashAccount    = Account::where('account_code', '1001')->first();
        $this->bankAccount    = Account::where('account_code', '1002')->first();
        $this->rentExpense    = Account::where('account_code', '5001')->first();
        $this->accountsPayable = Account::where('account_code', '2001')->first();
        $this->assistant      = User::where('email', 'assistant@example.com')->first();
        $this->head           = User::where('email', 'head@example.com')->first();
        $this->admin          = User::where('email', 'admin@example.com')->first();
    }
}
