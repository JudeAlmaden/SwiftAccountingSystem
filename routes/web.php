<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AccountGroupController;
use App\Http\Controllers\AccountReportController;
use App\Http\Controllers\BalanceSheetController;
use App\Http\Controllers\IncomeEntryController;
use App\Http\Controllers\ControlNumberPrefixController;
use App\Http\Controllers\JournalReportController;
use App\Http\Controllers\TrialBalanceController;

// Login view for unauthenticated users
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('auth/login');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard & Core
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::inertia('dashboard/inbox', 'inbox')->name('inbox');

    // Reports & Statistics
    Route::middleware(['role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
        Route::get('dashboard/vouchers/statistics', [JournalReportController::class, 'index'])->name('vouchers.statistics');
        Route::get('dashboard/chart-of-accounts/reports', [AccountReportController::class, 'index'])->name('accounts.reports');
    });

    Route::middleware(['role:accounting head|auditor'])->group(function () {
        Route::get('dashboard/financial-statements/trial-balance', [TrialBalanceController::class, 'index'])->name('trial-balance.index');
    });

    // Vouchers (Journals)
    Route::middleware(['role:accounting head|accounting assistant'])->group(function () {
        Route::inertia('dashboard/vouchers/create', 'vouchers/generate')->name('vouchers.create');
        Route::post('dashboard/vouchers', [JournalController::class, 'store'])->name('journals.store');
        Route::delete('dashboard/vouchers/{id}', [JournalController::class, 'destroy'])->name('journals.destroy');
    });

    Route::middleware(['role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
        Route::get('dashboard/vouchers', [JournalController::class, 'index'])->name('vouchers.index');
        Route::get('dashboard/vouchers/{id}', [JournalController::class, 'show'])->name('vouchers.show')->whereNumber('id');
    });

    // Accounts & Management
    Route::middleware(['role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
        Route::get('dashboard/chart-of-accounts', [AccountsController::class, 'index'])->name('accounts.index');
        Route::get('dashboard/chart-of-accounts/{id}', [AccountsController::class, 'show'])->name('accounts.show')->whereNumber('id');
    });

    Route::middleware(['role:accounting head'])->group(function () {
        Route::post('dashboard/chart-of-accounts', [AccountsController::class, 'store'])->name('accounts.store');
        Route::delete('dashboard/chart-of-accounts/{account}', [AccountsController::class, 'destroy'])->name('accounts.destroy');
        Route::post('dashboard/chart-of-accounts/{id}/toggle-status', [AccountsController::class, 'toggleStatus'])->name('accounts.toggleStatus');
        
        Route::post('dashboard/account-groups', [AccountGroupController::class, 'store'])->name('account-groups.store');
        Route::put('dashboard/account-groups/{id}', [AccountGroupController::class, 'update'])->name('account-groups.update');
        Route::delete('dashboard/account-groups/{id}', [AccountGroupController::class, 'destroy'])->name('account-groups.destroy');
    });

    // Accounting Entries & Statements
    Route::middleware(['role:accounting head|auditor'])->group(function () {
        Route::get('dashboard/income-entry', [IncomeEntryController::class, 'index'])->name('income-entry.index');
        Route::get('dashboard/balance-sheet', [BalanceSheetController::class, 'index'])->name('balance-sheet.index');
    });

    // Administration
    Route::middleware(['role:admin'])->group(function () {
        Route::get('dashboard/accounts', [UserController::class, 'index'])->name('users.index');
    });

    Route::middleware(['role:accounting head'])->group(function () {
        Route::get('dashboard/control-number-prefixes', [ControlNumberPrefixController::class, 'index'])->name('control-number-prefixes.index');
        Route::post('dashboard/control-number-prefixes', [ControlNumberPrefixController::class, 'store'])->name('api.control-number-prefixes.store');
        Route::put('dashboard/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'update'])->name('api.control-number-prefixes.update');
        Route::delete('dashboard/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'destroy'])->name('api.control-number-prefixes.destroy');
    });

    // Audit & System
    Route::middleware(['role:admin|auditor'])->group(function () {
        Route::get('dashboard/audit-trails', [AuditTrailController::class, 'index'])->name('audit-trails.index');
    });

    Route::get('attachments/download/{id}', [FileController::class, 'download'])->name('attachments.download');
});

require __DIR__.'/settings.php';
