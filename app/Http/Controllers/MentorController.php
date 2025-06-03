<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class MentorController extends Controller
{
    public function index()
    {
        $mentors = User::role('mentor')->latest()->get();

        return Inertia::render('admin/mentors/index', ['mentors' => $mentors]);
    }

    public function create()
    {
        return Inertia::render('admin/mentors/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone_number' => 'required|string|max:255',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'bio' => $request->bio,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('mentor');

        return redirect()->route('mentors.index')->with('success', 'Mentor berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $mentor = User::findOrFail($id);
        return Inertia::render('admin/mentors/edit', ['mentor' => $mentor]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $id,
            'phone_number' => 'required|string|max:255',
        ]);

        $mentor = User::findOrFail($id);
        $mentor->update($request->all());

        return redirect()->route('mentors.index')->with('success', 'Mentor berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $mentor = User::findOrFail($id);
        $mentor->delete();
        return redirect()->route('mentors.index')->with('success', 'Mentor berhasil dihapus.');
    }
}
