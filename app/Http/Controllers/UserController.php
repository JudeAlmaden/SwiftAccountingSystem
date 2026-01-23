<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Facades\Permission;
use Spatie\Permission\Facades\Role;

class UserController extends Controller
{
    /**
     * Display a paginated list of accounts.
     * Supports filtering by search, role, email.
     * Used for listing / table views.
     */
    function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string',
            'role'   => 'nullable|string',
            'email'  => 'nullable|string',
            'page'   => 'nullable|integer|min:1',
            'limit'  => 'nullable|integer|min:1|max:15',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        $limit = $validated['limit'] ?? 10;

        $users = User::with('roles')
            ->when($validated['search'] ?? null, fn ($q, $search) =>
                $q->where('name', 'like', "%{$search}%")
            )
            ->when($validated['role'] ?? null, fn ($q, $role) =>
                $q->whereHas('roles', fn ($qr) =>
                    $qr->where('name', $role)
                )
            )
            ->when($validated['email'] ?? null, fn ($q, $email) =>
                $q->where('email', 'like', "%{$email}%")
            )
            ->when($validated['status'] ?? null, fn ($q, $status) =>
                $q->where('status', $status)
            )
            ->paginate($limit);

        return response()->json($users);
    }

    /**
     * Store a newly created account in the database.
     * Handles validation and persistence.
     */
    function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => [
                'required',
                'string',
                Rule::exists('roles', 'name')
                    ->where(fn ($q) => $q->where('guard_name', 'web')),
            ],
            'status'   => 'nullable|string|in:active,inactive',
        ], [
            'email.unique'       => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'status'   => $validated['status'] ?? 'active',
            'password' => Hash::make($validated['password']),
        ]);

        // Enforce ONE role only
        $user->syncRoles([$validated['role']]);

        return response()->json([
            'message' => 'User created successfully.',
            'data'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'status' => $user->status,
                'role'   => $user->getRoleNames()->first(),
            ],
        ], 201);
    }

    /**
     * Display the specified account.
     */
    function show(Request $request, User $user){
        $validated = $request->validate([
            'id' => 'required|exists:users,id',
        ]);
        $user = User::with('roles')->find($validated['id']);
        
        return response()->json($user);
    }

    /**
     * Update an existing account in the database.
     */
    function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'status'   => 'nullable|string|in:active,inactive',
            'role'     => [
                'required',
                'string',
                Rule::exists('roles', 'name')->where(fn ($q) =>
                    $q->where('guard_name', 'web')
                ),
            ],
        ]);

        $user->update([
            'name'   => $validated['name'],
            'email'  => $validated['email'],
            'status' => $validated['status'] ?? 'active',
        ]);

        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Change role safely
        $user->syncRoles([$validated['role']]);

        return response()->json([
            'message' => 'User updated successfully.',
            'data'    => $user->load('roles'),
        ]);
    }
}
