<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\DisbursementController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
    Route::post('/accounts', [AccountsController::class, 'store'])->name('accounts.store');      // Save new account
     Route::delete('/accounts/{account}', [AccountsController::class, 'destroy'])->name('accounts.destroy');   // Delete account
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
});
