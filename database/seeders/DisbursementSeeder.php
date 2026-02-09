<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\DisbursementItem;
use App\Models\DisbursementTracking;
use App\Models\Account;
use App\Models\User;

class DisbursementSeeder extends Seeder
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
             // Fallback or exit
             return;
        }

        $faker = \Faker\Factory::create();

        // Loop 20 times
        for ($i = 1; $i <= 20; $i++) {
            $controlNumber = 'DV-2026-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            $titles = ['Office Supplies', 'Rent Payment', 'Utilities', 'Equipment Purchase', 'Consultancy Fee', 'Repair Services', 'Travel Expenses', 'Software Subscription'];
            $title = $titles[array_rand($titles)] . ' - ' . $faker->monthName;
            
            // Random Amount
            $amount = $faker->randomFloat(2, 1000, 50000);

            // Determine Status and Step
            // 30% Approved (Step 6), 20% Rejected, 50% Pending (Step 2-5)
            $rand = rand(1, 100);
            $targetStatus = 'pending';
            $targetStep = 2; // Default start at pending step 2

            if ($rand <= 30) {
                $targetStatus = 'approved';
                $targetStep = 6; // Completed
            } elseif ($rand <= 50) {
                $targetStatus = 'rejected';
                $targetStep = rand(2, 4); // Rejected at Head, Auditor or SVP
            } else {
                $targetStatus = 'pending';
                $targetStep = rand(2, 5); // Pending at varied steps
            }

            $disbursement = Disbursement::create([
                'control_number' => $controlNumber,
                'title' => $title,
                'description' => $faker->sentence,
                'step_flow' => Disbursement::defaultStepFlow(),
                'current_step' => $targetStep,
                'status' => $targetStatus,
                'check_id' => ($targetStep >= 6) ? 'CHK-' . rand(10000, 99999) : null,
                'created_at' => Carbon::now()->subDays(rand(1, 60)),
            ]);

            // Create Items (Balanced)
            // Debit Item
            $debitAccount = rand(0, 1) ? $this->rentExpense : $this->accountsPayable;
            $creditAccount = rand(0, 1) ? $this->cashAccount : $this->bankAccount;
            
            // Occasionally add multiple items for more complexity
            if (rand(0, 1)) {
                 // Split debit
                 $split1 = $amount * 0.6;
                 $split2 = $amount - $split1;
                 
                 DisbursementItem::create(['disbursement_id' => $disbursement->id, 'account_id' => $debitAccount->id, 'type' => 'debit', 'amount' => $split1, 'order_number' => 1]);
                 DisbursementItem::create(['disbursement_id' => $disbursement->id, 'account_id' => $this->rentExpense->id, 'type' => 'debit', 'amount' => $split2, 'order_number' => 2]);
                 DisbursementItem::create(['disbursement_id' => $disbursement->id, 'account_id' => $creditAccount->id, 'type' => 'credit', 'amount' => $amount, 'order_number' => 3]);
            } else {
                DisbursementItem::create(['disbursement_id' => $disbursement->id, 'account_id' => $debitAccount->id, 'type' => 'debit', 'amount' => $amount, 'order_number' => 1]);
                DisbursementItem::create(['disbursement_id' => $disbursement->id, 'account_id' => $creditAccount->id, 'type' => 'credit', 'amount' => $amount, 'order_number' => 2]);
            }

            // Create Tracking History based on target step/status
            // Always have Step 1 approved
            $createdTime = Carbon::parse($disbursement->created_at);
            
            DisbursementTracking::create([
                'disbursement_id' => $disbursement->id,
                'step' => 1,
                'role' => 'accounting assistant',
                'action' => 'approved',
                'remarks' => 'Generated and verified.',
                'handled_by' => $this->assistant->id,
                'acted_at' => $createdTime->copy()->addHours(1),
            ]);

            // If we are past step 2 or at step 2 (but if pending at 2, we stop here)
            // If rejected at 2, we log rejection
            if ($targetStep > 2 || ($targetStep == 2 && $targetStatus == 'rejected')) {
                 $action = ($targetStep == 2 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                 DisbursementTracking::create([
                    'disbursement_id' => $disbursement->id,
                    'step' => 2,
                    'role' => 'accounting head',
                    'action' => $action,
                    'remarks' => $action == 'rejected' ? 'Budget constraints.' : 'Approved.',
                    'handled_by' => $this->head->id,
                    'acted_at' => $createdTime->copy()->addHours(5),
                ]);
            }

            // Step 3 (Auditor)
            if ($targetStep > 3 || ($targetStep == 3 && $targetStatus == 'rejected')) {
                 $action = ($targetStep == 3 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                 DisbursementTracking::create([
                    'disbursement_id' => $disbursement->id,
                    'step' => 3,
                    'role' => 'auditor',
                    'action' => $action,
                    'remarks' => $action == 'rejected' ? 'Missing docs.' : 'Audited.',
                    'handled_by' => $this->admin->id, // Assuming admin is auditor for seed
                    'acted_at' => $createdTime->copy()->addDay(),
                ]);
            }

            // Step 4 (SVP)
            if ($targetStep > 4 || ($targetStep == 4 && $targetStatus == 'rejected')) {
                 $action = ($targetStep == 4 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                 DisbursementTracking::create([
                    'disbursement_id' => $disbursement->id,
                    'step' => 4,
                    'role' => 'svp',
                    'action' => $action,
                    'remarks' => $action == 'rejected' ? 'Declined by SVP.' : 'SVP Approved.',
                    'handled_by' => $this->admin->id,
                    'acted_at' => $createdTime->copy()->addDays(2),
                ]);
            }

             // Step 5 (Final)
            if ($targetStep > 5 || ($targetStep == 5 && $targetStatus == 'rejected')) {
                 $action = ($targetStep == 5 && $targetStatus == 'rejected') ? 'rejected' : 'approved';
                 DisbursementTracking::create([
                    'disbursement_id' => $disbursement->id,
                    'step' => 5,
                    'role' => 'accounting assistant',
                    'action' => $action,
                    'remarks' => $action == 'rejected' ? 'Check issue failure.' : 'Check released.',
                    'handled_by' => $this->assistant->id,
                    'acted_at' => $createdTime->copy()->addDays(3),
                ]);
            }
        }
    }

    private function resolveDependencies(): void
    {
        $this->cashAccount = Account::where('account_code', '1001')->first();
        $this->bankAccount = Account::where('account_code', '1002')->first();
        $this->rentExpense = Account::where('account_code', '5001')->first();
        $this->accountsPayable = Account::where('account_code', '2001')->first();
        $this->assistant = User::where('email', 'assistant@example.com')->first();
        $this->head = User::where('email', 'head@example.com')->first();
        $this->admin = User::where('email', 'admin@example.com')->first();
    }
}
