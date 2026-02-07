<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Validation\Rule;                                                                      

class UserController extends Controller
{

 // For Stat Card
    function stats()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'inactive')->count();
        $adminUsers = User::role('admin')->count();
        
        //Fetch the single user with special roles
        $accountingHead = User::role('accounting head')->where('status', 'active')->get();
        $svp = User::role('svp')->where('status', 'active')->get();
        $auditor = User::role('auditor')->where('status', 'active')->get();
        
        $specialUsers = [
            'accounting_head' => $accountingHead,
            'svp' => $svp,
            'auditor' => $auditor,
        ];
        return response()->json([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'inactive_users' => $inactiveUsers,
            'admin_users' => $adminUsers,
            'special_users' => $specialUsers,
        ]);
    }


    function indexPage()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'inactive')->count();
        $adminUsers = User::role('admin')->count();
        
        $accountingHead = User::role('accounting head')->where('status', 'active')->get();
        $svp = User::role('svp')->where('status', 'active')->get();
        $auditor = User::role('auditor')->where('status', 'active')->get();
        
        $specialUsers = [
            'accounting_head' => $accountingHead,
            'svp' => $svp,
            'auditor' => $auditor,
        ];

        // Get initial users list
        $users = User::with('roles')->paginate(10);

        return Inertia::render('admin/users', [
            'roles' => Role::all(),
            'permissions' => Permission::all(),
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'inactive_users' => $inactiveUsers,
                'admin_users' => $adminUsers,
            ],
            'specialUsers' => $specialUsers,
            'initialUsers' => $users,
        ]);
    }

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
                $q->where(fn($sq) => 
                    $sq->where('name', 'like', "%{$search}%")
                       ->orWhere('account_number', 'like', "%{$search}%")
                )
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
            ->paginate(10);

        return response()->json($users);
    }

    /**
     * Store a newly created account in the database.
     * Handles validation and persistence.
     */

    function store(Request $request)
    {
    $validated = $request->validate([
        'name'           => 'required|string|max:255',
        'account_number' => 'required|string|max:255|unique:users,account_number',
        'email'          => 'nullable|string|email|max:255|unique:users,email',
        'password'       => 'required|string|min:8|confirmed',
        'role'           => [
            'nullable', // Allow null role
            'string',
            Rule::exists('roles', 'name')
                ->where(fn ($q) => $q->where('guard_name', 'web')),
            function ($attribute, $value, $fail) {
                if ($value === 'admin') {
                    $fail('Cannot create new admin users.');
                }
            },
        ],
        'permissions'    => 'nullable|array', // Allow direct permissions
        'permissions.*'  => 'exists:permissions,name',
        'status'         => 'nullable|string|in:active,inactive',
    ], [
        'email.unique'          => 'This email is already registered.',
        'account_number.unique' => 'This employee number is already registered.',
        'password.confirmed'    => 'Password confirmation does not match.',
    ]);

    // Roles that must be UNIQUE among active users
    $uniqueRoles = ['admin', 'accounting head', 'svp', 'auditor'];

    if (
        $validated['role'] && // Check if role is present
        in_array($validated['role'], $uniqueRoles) &&
        ($validated['status'] ?? 'active') === 'active'
    ) {
        $exists = User::where('status', 'active')
            ->whereHas('roles', fn ($q) =>
                $q->where('name', $validated['role'])
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => "There can only be one active {$validated['role']}.",
            ], 422);
        }
    }

    // Create user AFTER validation checks
    $user = User::create([
        'name'           => $validated['name'],
        'account_number' => $validated['account_number'],
        'email'          => $validated['email'],
        'status'         => $validated['status'] ?? 'active',
        'password'       => Hash::make($validated['password']),
    ]);

    // Sync Role (if any)
    if (!empty($validated['role'])) {
        $user->syncRoles([$validated['role']]);
    }

    // Sync Permissions (Direct assignments)
    if (!empty($validated['permissions'])) {
        $user->syncPermissions($validated['permissions']);
    }

    return response()->json([
        'message' => 'User created successfully.',
        'data'    => [
            'id'             => $user->id,
            'name'           => $user->name,
            'account_number' => $user->account_number,
            'email'          => $user->email,
            'status'         => $user->status,
            'role'           => $user->getRoleNames()->first(),
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
            'id'             => 'required|exists:users,id',
            'name'           => 'required|string|max:255',
            'account_number' => 'required|string|max:255|unique:users,account_number,' . $request->id,
            'email'          => 'nullable|string|email|max:255|unique:users,email,' . $request->id,
            'password'       => 'nullable|string|min:8|confirmed',
            'status'         => 'nullable|string|in:active,inactive',
            'role'           => [
                'nullable',
                'string',
                Rule::exists('roles', 'name')
                    ->where(fn ($q) => $q->where('guard_name', 'web')),
                function ($attribute, $value, $fail) use ($request) {
                    $userToEdit = User::find($request->input('id'));
                    if ($value === 'admin' && $userToEdit && $userToEdit->id !== auth()->id()) {
                        $fail('Cannot assign admin role to other users.');
                    }
                },
            ],
            'permissions'    => 'nullable|array',
            'permissions.*'  => 'exists:permissions,name',
        ]);


        //Get the User
        $user = User::find($validated['id']);

        // Roles that must be unique among ACTIVE users
        $uniqueRoles = ['accounting head', 'admin', 'svp', 'auditor'];
        // Only check uniqueness if role is provided and in uniqueRoles
        if (!empty($validated['role']) && in_array($validated['role'], $uniqueRoles)) {
            $exists = User::where('status', 'active')
                ->where('id', '!=', $user->id) // exclude current user
                ->whereHas('roles', fn ($q) =>
                    $q->where('name', $validated['role'])
                )
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'role' => [
                            "There can only be one active {$validated['role']}."
                        ],
                    ],
                ],422);
            }
        }

        // Prevent admin from changing their own role or status (Self-Demotion Protection)
        if ($user->id === auth()->id()) {
            unset($validated['role']);
            unset($validated['status']);
        }

        // Update basic info
        $updateData = [
            'name'           => $validated['name'],
            'account_number' => $validated['account_number'],
            'email'          => $validated['email'],
        ];

        // Only update status if it was not unset (i.e., not self)
        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        $user->update($updateData);
            

        // Update password if provided
        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Sync Roles
        // If role is provided, sync it. If null (and explicitly sent as null/empty), remove roles?
        // Let's assume sending empty role means 'no role'
        if (array_key_exists('role', $validated)) {
             if ($validated['role']) {
                $user->syncRoles([$validated['role']]);
             } else {
                $user->syncRoles([]); // Remove all roles
             }
        }

        // Sync Permissions
        if (array_key_exists('permissions', $validated)) {
            $user->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'data'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'account_number' => $user->account_number,
                'email'          => $user->email,
                'status'         => $user->status,
                'roles'          => $user->getRoleNames(),
            ],
        ]);
    }
}
