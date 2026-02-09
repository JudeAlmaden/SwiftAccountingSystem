<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AccountGroupController;
use App\Http\Controllers\DisbursementController;
use App\Http\Controllers\DisbursementReportController;
use App\Http\Controllers\AccountReportController;
use App\Http\Controllers\ControlNumberPrefixController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\TemporaryUploadController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*==================
  Report API Routes (permission-gated)
===================*/
Route::middleware(['auth:sanctum', 'can:view disbursements'])->group(function () {
    Route::get('/reports/disbursements', [DisbursementReportController::class, 'index'])->name('api.reports.disbursements');
});

Route::middleware(['auth:sanctum', 'can:view accounts'])->group(function () {
    Route::get('/reports/accounts', [AccountReportController::class, 'index'])->name('api.reports.accounts');
});

/*==================
  Admin API Routes
===================*/
//For account management
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');

    // Accounts Management
    Route::get('/users', [UserController::class, 'index'])->name('users.index'); // List all accounts
    Route::post('/users/store', [UserController::class, 'store'])->name('users.store');      // Save new account
    Route::get('/users/{account}', [UserController::class, 'show'])->name('users.show'); // Show specific account
    Route::put('/users/{account}', [UserController::class, 'update'])->name('users.update');   // Update account
});

/*==================
  Accounting Head API Routes
===================*/
//For creating and deleting chart of accounts entries
Route::middleware(['auth:sanctum'])->group(function () {
    // Chart of Accounts Management
    Route::get('/accounts', [AccountsController::class, 'index'])->name('accounts.index'); // List all accounts
    Route::get('/accounts/{id}', [AccountsController::class, 'show'])->name('accounts.show'); // View specific account
    Route::post('/accounts', [AccountsController::class, 'store'])->name('accounts.store');      // Save new account
     Route::delete('/accounts/{account}', [AccountsController::class, 'destroy'])->name('accounts.destroy');   // Delete account
     Route::post('/accounts/{id}/toggle-status', [AccountsController::class, 'toggleStatus'])->name('accounts.toggleStatus');

     // Account Groups
     Route::get('/account-groups', [AccountGroupController::class, 'index'])->name('account-groups.index');
     Route::post('/account-groups', [AccountGroupController::class, 'store'])->name('account-groups.store');
     Route::put('/account-groups/{id}', [AccountGroupController::class, 'update'])->name('account-groups.update');
     Route::delete('/account-groups/{id}', [AccountGroupController::class, 'destroy'])->name('account-groups.destroy');
     Route::get('/account-groups/{id}', [AccountGroupController::class, 'show'])->name('account-groups.show');
});

/*==================
  Control Number Prefixes (list for dropdown; accounting head manages)
===================*/
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/control-number-prefixes', [ControlNumberPrefixController::class, 'index'])->name('api.control-number-prefixes.index');
});
Route::middleware(['auth:sanctum', 'role:accounting head'])->group(function () {
    Route::post('/control-number-prefixes', [ControlNumberPrefixController::class, 'store'])->name('api.control-number-prefixes.store');
    Route::put('/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'update'])->name('api.control-number-prefixes.update');
    Route::delete('/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'destroy'])->name('api.control-number-prefixes.destroy');
});

/*==================
  Disbursement API Routes
===================*/
//For creating and deleting disbursement entries
Route::middleware(['auth:sanctum'])->group(function () {
    // Disbursement Management
    Route::get('/disbursements', [DisbursementController::class, 'index'])->name('disbursements.index'); // List all disbursements
    Route::post('/disbursements', [DisbursementController::class, 'store'])->name('disbursements.store');      // Save new disbursement
    Route::get('/disbursements/{id}', [DisbursementController::class, 'show'])->name('disbursements.show'); // Show specific disbursement
    Route::delete('/disbursements/{id}', [DisbursementController::class, 'destroy'])->name('disbursements.destroy');   // Delete disbursement

    /*==================
      Notification API Routes
    ===================*/
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markRead');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');

    /*==================
      Disbursement Actions
    ===================*/
    Route::post('/disbursements/{id}/approve', [DisbursementController::class, 'approve'])
        ->middleware('can:approve disbursements')
        ->name('disbursements.approve');

    Route::post('/disbursements/{id}/decline', [DisbursementController::class, 'decline'])
        ->middleware('can:approve disbursements')
        ->name('disbursements.decline');

    /*==================
      Audit Trails
    ===================*/
     Route::middleware(['can:view audit trails'])->group(function () {
        Route::get('/audit-trails', [AuditTrailController::class, 'index'])->name('audit-trails.data');
        Route::get('/audit-trails/filters', [AuditTrailController::class, 'filters'])->name('audit-trails.filters');
    });

    /*==================
      Attachments
    ===================*/
    Route::post('/attachments/upload-temp', [TemporaryUploadController::class, 'upload'])->name('attachments.upload-temp');
    Route::delete('/attachments/revert-temp', [TemporaryUploadController::class, 'revert'])->name('attachments.revert-temp');

    /*==================
      Trial Balance
    ===================*/
      Route::get('/api/trial-balance/data', [App\Http\Controllers\TrialBalanceController::class, 'getData'])
      ->middleware(['can:create trial balance'])->name('api.trial-balance.data');
});
