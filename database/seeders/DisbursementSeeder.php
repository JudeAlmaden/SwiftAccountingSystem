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
            $this->command->warn('Required users not found. Run UsersSeeder first.');
            return;
        }
        if (!$this->cashAccount || !$this->bankAccount || !$this->rentExpense || !$this->accountsPayable) {
            $this->command->warn('Required accounts not found. Run ChartOfAccountsSeeder first.');
            return;
        }

        $this->seedDisbursement1();
        $this->seedDisbursement2();
        $this->seedDisbursement3();
        $this->seedDisbursement4();
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

    /** Step flow: use default (role-based only). Set user_id only when a step must be restricted to a specific user. */

    private function createItems(int $disbursementId, array $rows): void
    {
        foreach ($rows as $i => $row) {
            DisbursementItem::create([
                'disbursement_id' => $disbursementId,
                'account_id' => $row['account_id'],
                'type' => $row['type'],
                'amount' => $row['amount'],
                'order_number' => $i + 1,
            ]);
        }
    }

    private function createTracking(int $disbursementId, array $rows): void
    {
        foreach ($rows as $row) {
            DisbursementTracking::create(array_merge($row, [
                'disbursement_id' => $disbursementId,
            ]));
        }
    }

    /** DV-001: Fully approved (all 4 steps done). */
    private function seedDisbursement1(): void
    {
        $d = Disbursement::create([
            'control_number' => 'DV-2026-001',
            'title' => 'Office Rent Payment - January 2026',
            'description' => 'Monthly office rent payment for the main office building',
            'step_flow' => Disbursement::defaultStepFlow(),
            'current_step' => 5,
            'status' => 'approved',
        ]);

        $this->createItems($d->id, [
            ['account_id' => $this->rentExpense->id, 'type' => 'debit', 'amount' => 50000.00],
            ['account_id' => $this->cashAccount->id, 'type' => 'credit', 'amount' => 50000.00],
        ]);

        $this->createTracking($d->id, [
            ['handled_by' => $this->assistant->id, 'step' => 1, 'role' => 'accounting assistant', 'action' => 'approved', 'remarks' => 'Verified supporting documents. All in order.', 'acted_at' => Carbon::now()->subDays(5)],
            ['handled_by' => $this->head->id, 'step' => 2, 'role' => 'accounting head', 'action' => 'approved', 'remarks' => 'Approved for payment.', 'acted_at' => Carbon::now()->subDays(4)],
            ['handled_by' => $this->admin->id, 'step' => 3, 'role' => 'auditor', 'action' => 'approved', 'remarks' => 'Audit complete. No issues found.', 'acted_at' => Carbon::now()->subDays(3)],
            ['handled_by' => $this->admin->id, 'step' => 4, 'role' => 'svp', 'action' => 'approved', 'remarks' => 'Final approval granted.', 'acted_at' => Carbon::now()->subDays(2)],
        ]);
    }

    /** DV-002: Pending at accounting head (step 1 done). */
    private function seedDisbursement2(): void
    {
        $d = Disbursement::create([
            'control_number' => 'DV-2026-002',
            'title' => 'Supplier Payment - ABC Corp',
            'description' => 'Payment for office supplies and equipment',
            'step_flow' => Disbursement::defaultStepFlow(),
            'current_step' => 2,
            'status' => 'pending',
        ]);

        $this->createItems($d->id, [
            ['account_id' => $this->accountsPayable->id, 'type' => 'debit', 'amount' => 25000.00],
            ['account_id' => $this->bankAccount->id, 'type' => 'credit', 'amount' => 25000.00],
        ]);

        $this->createTracking($d->id, [
            ['handled_by' => $this->assistant->id, 'step' => 1, 'role' => 'accounting assistant', 'action' => 'approved', 'remarks' => 'Documents verified and complete.', 'acted_at' => Carbon::now()->subDays(2)],
            ['handled_by' => null, 'step' => 2, 'role' => 'accounting head', 'action' => 'pending', 'remarks' => null, 'acted_at' => null],
        ]);
    }

    /** DV-003: Just submitted, pending at assistant (step 1). */
    private function seedDisbursement3(): void
    {
        $d = Disbursement::create([
            'control_number' => 'DV-2026-003',
            'title' => 'Utility Bills Payment',
            'description' => 'Electricity and water bills for January 2026',
            'step_flow' => Disbursement::defaultStepFlow(),
            'current_step' => 1,
            'status' => 'pending',
        ]);

        $this->createItems($d->id, [
            ['account_id' => $this->accountsPayable->id, 'type' => 'debit', 'amount' => 15000.00],
            ['account_id' => $this->cashAccount->id, 'type' => 'credit', 'amount' => 15000.00],
        ]);

        $this->createTracking($d->id, [
            ['handled_by' => null, 'step' => 1, 'role' => 'accounting assistant', 'action' => 'pending', 'remarks' => null, 'acted_at' => null],
        ]);
    }

    /** DV-004: Rejected at auditor (steps 1–2 approved, step 3 rejected). */
    private function seedDisbursement4(): void
    {
        $d = Disbursement::create([
            'control_number' => 'DV-2026-004',
            'title' => 'Equipment Purchase',
            'description' => 'New computer equipment for accounting department',
            'step_flow' => Disbursement::defaultStepFlow(),
            'current_step' => 3,
            'status' => 'rejected',
        ]);

        $this->createItems($d->id, [
            ['account_id' => $this->accountsPayable->id, 'type' => 'debit', 'amount' => 75000.00],
            ['account_id' => $this->bankAccount->id, 'type' => 'credit', 'amount' => 75000.00],
        ]);

        $this->createTracking($d->id, [
            ['handled_by' => $this->assistant->id, 'step' => 1, 'role' => 'accounting assistant', 'action' => 'approved', 'remarks' => 'All documents attached.', 'acted_at' => Carbon::now()->subDays(3)],
            ['handled_by' => $this->head->id, 'step' => 2, 'role' => 'accounting head', 'action' => 'approved', 'remarks' => 'Budget allocation confirmed.', 'acted_at' => Carbon::now()->subDays(2)],
            ['handled_by' => $this->admin->id, 'step' => 3, 'role' => 'auditor', 'action' => 'rejected', 'remarks' => 'Missing purchase order. Please resubmit with complete documentation.', 'acted_at' => Carbon::now()->subDays(1)],
        ]);
    }
}
