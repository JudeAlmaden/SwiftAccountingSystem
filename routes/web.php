<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\FileController;

// Login view for unauthenticated users
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('auth/login');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Inbox
    Route::get('dashboard/inbox', function(){
        return Inertia::render('inbox');
    })->name('inbox');

    // Create Voucher (Requires create journals permission)
    Route::middleware(['can:create journals'])->group(function () {
        Route::get('dashboard/vouchers/generate', function(){
            return Inertia::render('vouchers/generate');
        })->name('vouchers.generate');
    });

    // Control number prefixes (accounting head or permission)
    Route::middleware(['role_or_permission:accounting head|manage control number prefixes'])->group(function () {
        Route::get('/dashboard/control-number-prefixes', function () {
            return Inertia::render('control-number-prefixes/index');
        })->name('control-number-prefixes.index');
    });

    // View Vouchers (Requires view journals permission)
    Route::middleware(['can:view journals'])->group(function () {
        Route::get('/dashboard/vouchers', function(){
            return Inertia::render('vouchers/index');
        })->name('vouchers');

        Route::get('dashboard/vouchers/{id}', function($id){
            return Inertia::render('vouchers/view', ['id' => $id]);
        })->name('vouchers.view');

        Route::get('/dashboard/reports/journals', function () {
            return Inertia::render('reports/journal');
        })->name('reports.journals');
    });

    // Account Reports (Requires view accounts permission)
    Route::middleware(['can:view accounts'])->group(function () {
        Route::get('/dashboard/reports/accounts', function () {
            return Inertia::render('reports/accounts');
        })->name('reports.accounts');
    });


    // Create/Edit/View Users (Requires view users permission at least, page handles nuances?)
    // Based on sidebar, this is "Users and Accounts"
    Route::middleware(['can:view users'])->group(function () {
        Route::get('/dashboard/accounts', [UserController::class, 'indexPage'])->name('users');
    });

    // Chart of Accounts (Requires view accounts permission)
    Route::middleware(['can:view accounts'])->group(function () {
        Route::get('/dashboard/chart-of-accounts',function(){
            return Inertia::render('Accounts/accounts');
        })->name('accounts');
        
        Route::get('/dashboard/chart-of-accounts/{id}', function($id){
            return Inertia::render('Accounts/view', ['id' => $id]);
        })->name('accounts.view');
    });


    // Audit Trails (auditor / admin)
    Route::middleware(['can:view audit trails'])->group(function () {
        Route::get('/dashboard/audit-trails', [AuditTrailController::class, 'indexPage'])->name('audit-trails.index');
    });

    // Attachments
    Route::get('/attachments/download/{id}', [FileController::class, 'download'])->name('attachments.download');

    // Trial Balance (Requires create trial balance permission)
    Route::middleware(['can:create trial balance'])->group(function () {
        Route::get('/dashboard/reports/trial-balance', function(){
            return Inertia::render('reports/TrialBalance');
        })->name('trial-balance.index');
    });
});

require __DIR__.'/settings.php';
