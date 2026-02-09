<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountGroup extends Model
{
    protected $fillable = [
        'name',
        'grp_code',
        'account_type',
        'sub_account_type',
    ];

    public function accounts()
    {
        return $this->hasMany(Account::class);
    }
}
