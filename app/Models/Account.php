<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = [
        'account_name',
        'account_number',
        'account_description',
        'account_code',
        'account_type',
        'sub_account_type',
        'account_group_id',
        'status',
    ];

    /**
     * Get valid sub-account types for a given account type
     */
    public static function getSubAccountTypes(string $accountType): array
    {
        $subTypes = [
            'Assets' => ['Current Assets', 'Non-Current Assets', 'Contra Assets'],
            'Liabilities' => ['Current Liabilities', 'Non-Current Liabilities', 'Contingent Liabilities'],
            'Equity' => ['Capital', 'Retained Earnings', 'Contra Equity'],
            'Revenue' => ['Operating Revenue', 'Non-Operating Revenue', 'Contra Revenue'],
            'Expenses' => ['Operating Expenses', 'Non-Operating Expenses', 'Cost of Goods Sold', 'Contra Expenses'],
        ];

        return $subTypes[$accountType] ?? [];
    }

    /**
     * Get all account types and their sub-types
     */
    public static function getAllAccountTypeStructure(): array
    {
        return [
            'Assets' => ['Current Assets', 'Non-Current Assets', 'Contra Assets'],
            'Liabilities' => ['Current Liabilities', 'Non-Current Liabilities', 'Contingent Liabilities'],
            'Equity' => ['Capital', 'Retained Earnings', 'Contra Equity'],
            'Revenue' => ['Operating Revenue', 'Non-Operating Revenue', 'Contra Revenue'],
            'Expenses' => ['Operating Expenses', 'Non-Operating Expenses', 'Cost of Goods Sold', 'Contra Expenses'],
        ];
    }

    /**
     * Get the disbursement items associated with the account.
     */
    public function disbursementItems()
    {
        return $this->hasMany(DisbursementItem::class);
    }

    /**
     * Get the account group that owns the account.
     */
    public function group()
    {
        return $this->belongsTo(AccountGroup::class, 'account_group_id');
    }
}
