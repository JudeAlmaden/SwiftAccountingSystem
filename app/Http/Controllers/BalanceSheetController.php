<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BalanceSheetController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('balance sheet/index');
    }
}
