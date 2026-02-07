<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

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
    Route::get('dashboard', App\Http\Controllers\DashboardController::class)->name('dashboard');

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

        Route::get('/dashboard/reports/disbursements/data', [App\Http\Controllers\DisbursementReportController::class, 'index'])
            ->name('reports.disbursements.data');
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
        Route::get('/dashboard/accounts', [App\Http\Controllers\UserController::class, 'indexPage'])->name('users');

        // API Routes for Users (consumed by the React frontend)
        Route::get('/users/data', [App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::get('/users/stats', [App\Http\Controllers\UserController::class, 'stats'])->name('users.stats');
        Route::post('/users', [App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [App\Http\Controllers\UserController::class, 'update'])->name('users.update');
    });

    // Chart of Accounts (Requires view accounts permission)
    Route::middleware(['can:view accounts'])->group(function () {
        Route::get('/dashboard/chart-of-accounts',function(){
            return Inertia::render('Accounts/accounts');
        })->name('accounts');
    });

    // Disbursement Actions
    Route::post('/disbursements/{id}/approve', [App\Http\Controllers\DisbursementController::class, 'approve'])
        ->middleware('can:approve disbursements')
        ->name('disbursements.approve');

    Route::post('/disbursements/{id}/decline', [App\Http\Controllers\DisbursementController::class, 'decline'])
        ->middleware('can:approve disbursements')
        ->name('disbursements.decline');

    // Audit Trails (auditor / admin)
    Route::middleware(['can:view audit trails'])->group(function () {
        Route::get('/dashboard/audit-trails', [App\Http\Controllers\AuditTrailController::class, 'indexPage'])->name('audit-trails.index');
        Route::get('/audit-trails/data', [App\Http\Controllers\AuditTrailController::class, 'index'])->name('audit-trails.data');
        Route::get('/audit-trails/filters', [App\Http\Controllers\AuditTrailController::class, 'filters'])->name('audit-trails.filters');
    });

    // Attachments
    Route::get('/attachments/download/{id}', [App\Http\Controllers\FileController::class, 'download'])->name('attachments.download');
    Route::post('/attachments/upload-temp', [App\Http\Controllers\TemporaryUploadController::class, 'upload'])->name('attachments.upload-temp');
    Route::delete('/attachments/revert-temp', [App\Http\Controllers\TemporaryUploadController::class, 'revert'])->name('attachments.revert-temp');
});

require __DIR__.'/settings.php';
