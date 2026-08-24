<?php

namespace App\Http\Controllers;

use App\Models\User;
use Database\Seeders\StaffPermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $query = User::role('staff')->with('permissions');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('instance', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $baseQuery = User::role('staff');
        $totalStaff = (clone $baseQuery)->count();
        $verifiedStaff = (clone $baseQuery)->whereNotNull('email_verified_at')->count();
        $unverifiedStaff = (clone $baseQuery)->whereNull('email_verified_at')->count();

        $statistics = [
            'overview' => [
                'total_staff' => $totalStaff,
                'verified_staff' => $verifiedStaff,
                'unverified_staff' => $unverifiedStaff,
            ],
        ];

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $staff = $query->latest()
            ->paginate($perPage)
            ->withQueryString();

        $staff->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'instance' => $user->instance,
                'city' => $user->city,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'permissions' => $user->permissions->pluck('name'),
                'permissions_count' => $user->permissions->count(),
            ];
        });

        return Inertia::render('admin/staff/index', [
            'staff' => $staff,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
            'permission_modules' => StaffPermissionSeeder::getPermissionModules(),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/staff/create', [
            'permission_modules' => StaffPermissionSeeder::getPermissionModules(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone_number' => 'required|string|max:255',
            'password' => 'required|string|min:8',
            'instance' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string|exists:permissions,name',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars/staff', 'public');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'instance' => $request->instance,
            'city' => $request->city,
            'password' => Hash::make($request->password),
            'avatar' => $avatarPath,
            'email_verified_at' => now(),
        ]);

        $user->assignRole('staff');
        $user->syncPermissions($request->permissions);

        return redirect()->route('staff.index')->with('success', 'Staff baru berhasil ditambahkan.');
    }

    public function show(string $id)
    {
        $staff = User::role('staff')->with('permissions')->findOrFail($id);

        return Inertia::render('admin/staff/show', [
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'phone_number' => $staff->phone_number,
                'instance' => $staff->instance,
                'city' => $staff->city,
                'avatar' => $staff->avatar ? asset('storage/' . $staff->avatar) : null,
                'email_verified_at' => $staff->email_verified_at,
                'created_at' => $staff->created_at,
                'permissions' => $staff->permissions->pluck('name'),
            ],
            'permission_modules' => StaffPermissionSeeder::getPermissionModules(),
        ]);
    }

    public function edit(string $id)
    {
        $staff = User::role('staff')->with('permissions')->findOrFail($id);

        return Inertia::render('admin/staff/edit', [
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'phone_number' => $staff->phone_number,
                'instance' => $staff->instance,
                'city' => $staff->city,
                'avatar' => $staff->avatar ? asset('storage/' . $staff->avatar) : null,
                'permissions' => $staff->permissions->pluck('name'),
            ],
            'permission_modules' => StaffPermissionSeeder::getPermissionModules(),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $staff = User::role('staff')->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $id,
            'phone_number' => 'required|string|max:255',
            'password' => 'nullable|string|min:8',
            'instance' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'string|exists:permissions,name',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'instance' => $request->instance,
            'city' => $request->city,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('avatar')) {
            if ($staff->avatar && Storage::disk('public')->exists($staff->avatar)) {
                Storage::disk('public')->delete($staff->avatar);
            }
            $updateData['avatar'] = $request->file('avatar')->store('avatars/staff', 'public');
        }

        $staff->update($updateData);
        $staff->syncPermissions($request->permissions);

        return redirect()->route('staff.index')->with('success', 'Data staff berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $staff = User::role('staff')->findOrFail($id);

        if ($staff->avatar && Storage::disk('public')->exists($staff->avatar)) {
            Storage::disk('public')->delete($staff->avatar);
        }

        $staff->delete();

        return redirect()->route('staff.index')->with('success', 'Staff berhasil dihapus.');
    }
}
