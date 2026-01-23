<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*==================
  Admin API Routes
===================*/
//For account management
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Accounts Management
    Route::get('/accounts', [AccountController::class, 'index'])->name('accounts.index'); // List all accounts
    Route::get('/accounts/create', [AccountController::class, 'create']); // Show create form
    Route::post('/accounts', [AccountController::class, 'store']);      // Save new account
    Route::get('/accounts/{account}/edit', [AccountController::class, 'edit']); // Show edit form
    Route::put('/accounts/{account}', [AccountController::class, 'update']);   // Update account
    Route::delete('/accounts/{account}', [AccountController::class, 'destroy']); // Delete account
});
