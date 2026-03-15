<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AccountGroupController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\JournalReportController;
use App\Http\Controllers\AccountReportController;
use App\Http\Controllers\ControlNumberPrefixController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\TemporaryUploadController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*==================
  Report API Routes
 ===================*/
Route::middleware(['auth:sanctum', 'role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
    Route::get('/vouchers/statistics', [JournalReportController::class, 'index'])->name('api.vouchers.statistics');
    Route::get('/accounts/reports', [AccountReportController::class, 'index'])->name('api.accounts.reports');
});

/*==================
  Admin API Routes
 ===================*/
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');
});



/*==================
  Control Number Prefixes
 ===================*/
Route::middleware(['auth:sanctum', 'role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
    Route::get('/control-number-prefixes', [ControlNumberPrefixController::class, 'index'])->name('api.control-number-prefixes.index');
});

Route::middleware(['auth:sanctum', 'role:accounting head'])->group(function () {
    Route::post('/control-number-prefixes', [ControlNumberPrefixController::class, 'store'])->name('api.control-number-prefixes.store');
    Route::put('/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'update'])->name('api.control-number-prefixes.update');
    Route::delete('/control-number-prefixes/{controlNumberPrefix}', [ControlNumberPrefixController::class, 'destroy'])->name('api.control-number-prefixes.destroy');
});

/*==================
  Journal Management API Routes
 ===================*/
Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware(['role:accounting head|accounting assistant|auditor|SVP'])->group(function () {
        Route::get('/journals', [JournalController::class, 'index'])->name('journals.index');
        Route::get('/journals/{id}', [JournalController::class, 'show'])->name('journals.show');
    });

    // Notifications (All authenticated users)
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.markRead');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.markAllRead');

    // Journal Actions (Strict Role Check)
    Route::post('/journals/{id}/approve', [JournalController::class, 'approve'])
        ->middleware('role:accounting head|accounting assistant|auditor|SVP')
        ->name('journals.approve');

    Route::post('/journals/{id}/decline', [JournalController::class, 'decline'])
        ->middleware('role:accounting head|accounting assistant|auditor|SVP')
        ->name('journals.decline');

    // Attachments (All authenticated users for temp upload)
    Route::post('/attachments/upload-temp', [TemporaryUploadController::class, 'upload'])->name('attachments.upload-temp');
    Route::delete('/attachments/revert-temp', [TemporaryUploadController::class, 'revert'])->name('attachments.revert-temp');

    // Financial Statements Data
    Route::get('/api/trial-balance/data', [App\Http\Controllers\TrialBalanceController::class, 'getData'])
        ->middleware(['role:accounting head|auditor'])
        ->name('api.trial-balance.data');
});
