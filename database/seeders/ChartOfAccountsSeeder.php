<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account; 

class ChartOfAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            ['account_name' => 'Cash', 'account_description' => 'Cash on hand', 'account_code' => '1001', 'account_type' => 'Asset', 'normal_side' => 'debit'],
            ['account_name' => 'Bank', 'account_description' => 'Bank account', 'account_code' => '1002', 'account_type' => 'Asset', 'normal_side' => 'debit'],
            ['account_name' => 'Accounts Receivable', 'account_description' => 'Money owed by customers', 'account_code' => '1003', 'account_type' => 'Asset', 'normal_side' => 'debit'],
            ['account_name' => 'Inventory', 'account_description' => 'Inventory of goods', 'account_code' => '1004', 'account_type' => 'Asset', 'normal_side' => 'debit'],
            ['account_name' => 'Prepaid Expenses', 'account_description' => 'Expenses paid in advance', 'account_code' => '1005', 'account_type' => 'Asset', 'normal_side' => 'debit'],
            ['account_name' => 'Accounts Payable', 'account_description' => 'Money owed to suppliers', 'account_code' => '2001', 'account_type' => 'Liability', 'normal_side' => 'credit'],
            ['account_name' => 'Loans Payable', 'account_description' => 'Bank loans', 'account_code' => '2002', 'account_type' => 'Liability', 'normal_side' => 'credit'],
            ['account_name' => 'Owner\'s Capital', 'account_description' => 'Owner investment', 'account_code' => '3001', 'account_type' => 'Equity', 'normal_side' => 'credit'],
            ['account_name' => 'Sales Revenue', 'account_description' => 'Revenue from sales', 'account_code' => '4001', 'account_type' => 'Revenue', 'normal_side' => 'credit'],
            ['account_name' => 'Rent Expense', 'account_description' => 'Office rent', 'account_code' => '5001', 'account_type' => 'Expense', 'normal_side' => 'debit'],
        ];

        foreach ($accounts as $account) {
            Account::create($account);
        }
    }
}
