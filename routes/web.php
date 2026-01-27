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
        return("disbursement.view");
    });

    Route::get('dashboard/disbursements/inbox', function(){
        return;
    });

    Route::get('dashboard/disbursements/inbox/{id}', function($id){
        return;
    });
});





require __DIR__.'/settings.php';
