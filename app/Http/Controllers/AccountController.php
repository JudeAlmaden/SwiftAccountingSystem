<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;

class AccountController extends Controller
{
    function index(){
        // Use 'with' to include roles, and 'get' instead of 'all'
        return response()->json(User::with('roles')->get());
    }

    function create(){

    }

    function store(){

    }

    function edit(){

    }

    function update(){

    }

    function destroy(){
        
    }
}
