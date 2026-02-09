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

    // Create Disbursement (Requires create permission)
    Route::middleware(['can:create disbursements'])->group(function () {
        Route::get('dashboard/disbursements/generate', function(){
            return Inertia::render('disbursement/generate');
        })->name('disbursement.generate');
    });

    // Control number prefixes (accounting head or permission)
    Route::middleware(['role_or_permission:accounting head|manage control number prefixes'])->group(function () {
        Route::get('/dashboard/control-number-prefixes', function () {
            return Inertia::render('control-number-prefixes/index');
        })->name('control-number-prefixes.index');
    });

    // View Disbursements (Requires view permission)
    Route::middleware(['can:view disbursements'])->group(function () {
        Route::get('/dashboard/disbursements', function(){
            return Inertia::render('disbursement/index');
        })->name('disbursements');

        Route::get('dashboard/disbursements/{id}', function($id){
            return Inertia::render('disbursement/view', ['id' => $id]);
        })->name('disbursement.view');

        Route::get('/dashboard/reports/disbursements', function () {
            return Inertia::render('reports/disbursement');
        })->name('reports.disbursements');
    });

    // Account Reports (Requires view accounts permission)
    Route::middleware(['can:view accounts'])->group(function () {
        Route::get('/dashboard/reports/accounts', function () {
            return Inertia::render('reports/accounts');
        })->name('reports.accounts');
    });

    Route::get('dashboard/accounts/{id}', function($id){
        return Inertia::render('Accounts/view', ['id' => $id]);
    })->name('accounts.view');
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

    Route::get('dashboard/accounts/view/{id}', function($id){
        return Inertia::render('Accounts/view');
    })->name('accounts.view');
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
