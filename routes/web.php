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
Route::middleware(['auth', 'verified'])->group(function () {
    //Default dashboard, same for all roles
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    //Views for the admin role
    Route::get('/dashboard/accounts', function () {
        return Inertia::render('admin/accounts');
    })->name('accounts');

});





require __DIR__.'/settings.php';
