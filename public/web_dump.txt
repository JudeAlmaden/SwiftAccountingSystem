<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Auth;

use App\Http\Controllers\UserController;

//Login view for unauthenticated users, return to dashboard if user is already logged in
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('auth/login');
})->name('home');

//Here are the views for all the users
//NO ROLE VERIFICATION HAS BEEN APPLIED YET  
Route::middleware(['auth', 'verified'])->group(function () {
    //Default dashboard, same for all roles
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    //Views for the admin role
    Route::get('/dashboard/accounts', function () {
        return Inertia::render('admin/users');
    })->name('users');

    //Unique to accounting head
    Route::get('/dashboard/chart-of-accounts',function(){
        return Inertia::render('accounting-head/accounts');
    })->name('accounts');

    //Disbursement routes
    Route::get('/dashboard/disbursements', function(){
        return Inertia::render('disbursement/index');
    })->name('disbursements');

    Route::get('dashboard/disbursements/generate', function(){
        return Inertia::render('disbursement/generate');
    })->name('disbursement.generate');

    Route::get('dashboard/disbursements/{id}', function($id){
        return Inertia::render('disbursement/view', ['id' => $id]);
    })->name('disbursement.view');

    //Inbox
    Route::get('dashboard/inbox', function(){
        return Inertia::render('inbox');
    })->name('inbox');
});



require __DIR__.'/settings.php';
//Made by ai, if it works it works
Route::get('/attachments/download/{id}', [App\Http\Controllers\FileController::class, 'download'])->name('attachments.download');

Route::get('/attachments/download/{id}', 'App\Http\Controllers\FileController@download')->name('attachments.download');

Route::post('/attachments/upload-temp', [App\Http\Controllers\TemporaryUploadController::class, 'upload'])->name('attachments.upload-temp');
Route::delete('/attachments/revert-temp', [App\Http\Controllers\TemporaryUploadController::class, 'revert'])->name('attachments.revert-temp');

Route::post('/disbursements/{id}/approve', [App\Http\Controllers\DisbursementController::class, 'approve'])->name('disbursements.approve');
Route::post('/disbursements/{id}/decline', [App\Http\Controllers\DisbursementController::class, 'decline'])->name('disbursements.decline');

