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
        // define groups
        $groups = [
            ['name' => 'Cash & Cash Equivalents', 'grp_code' => '100', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets'],
            ['name' => 'Trade Payables', 'grp_code' => '200', 'account_type' => 'Liabilities', 'sub_account_type' => 'Current Liabilities'],
            ['name' => 'Administrative Expenses', 'grp_code' => '500', 'account_type' => 'Expenses', 'sub_account_type' => 'Operating Expenses'],
        ];

        $createdGroups = [];
        foreach ($groups as $group) {
            $createdGroups[$group['name']] = \App\Models\AccountGroup::create($group);
        }

        $accounts = [
            ['account_name' => 'Cash', 'account_description' => 'Cash on hand', 'account_code' => '1001', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets', 'account_normal_side' => 'debit', 'account_group_id' => $createdGroups['Cash & Cash Equivalents']->id ?? null],
            ['account_name' => 'Bank', 'account_description' => 'Bank account', 'account_code' => '1002', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets', 'account_normal_side' => 'debit', 'account_group_id' => $createdGroups['Cash & Cash Equivalents']->id ?? null],
            ['account_name' => 'Accounts Receivable', 'account_description' => 'Money owed by customers', 'account_code' => '1003', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets', 'account_normal_side' => 'debit', 'account_group_id' => null],
            ['account_name' => 'Inventory', 'account_description' => 'Inventory of goods', 'account_code' => '1004', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets', 'account_normal_side' => 'debit', 'account_group_id' => null],
            ['account_name' => 'Prepaid Expenses', 'account_description' => 'Expenses paid in advance', 'account_code' => '1005', 'account_type' => 'Assets', 'sub_account_type' => 'Current Assets', 'account_normal_side' => 'debit', 'account_group_id' => null],
            ['account_name' => 'Accounts Payable', 'account_description' => 'Money owed to suppliers', 'account_code' => '2001', 'account_type' => 'Liabilities', 'sub_account_type' => 'Current Liabilities', 'account_normal_side' => 'credit', 'account_group_id' => $createdGroups['Trade Payables']->id ?? null],
            ['account_name' => 'Loans Payable', 'account_description' => 'Bank loans', 'account_code' => '2002', 'account_type' => 'Liabilities', 'sub_account_type' => 'Non-Current Liabilities', 'account_normal_side' => 'credit', 'account_group_id' => null],
            ['account_name' => 'Owner\'s Capital', 'account_description' => 'Owner investment', 'account_code' => '3001', 'account_type' => 'Equity', 'sub_account_type' => 'Capital', 'account_normal_side' => 'credit', 'account_group_id' => null],
            ['account_name' => 'Sales Revenue', 'account_description' => 'Revenue from sales', 'account_code' => '4001', 'account_type' => 'Revenue', 'sub_account_type' => 'Operating Revenue', 'account_normal_side' => 'credit', 'account_group_id' => null],
            ['account_name' => 'Rent Expense', 'account_description' => 'Office rent', 'account_code' => '5001', 'account_type' => 'Expenses', 'sub_account_type' => 'Operating Expenses', 'account_normal_side' => 'debit', 'account_group_id' => $createdGroups['Administrative Expenses']->id ?? null],
        ];

        foreach ($accounts as $account) {
            Account::create($account);
        }
    }
}
