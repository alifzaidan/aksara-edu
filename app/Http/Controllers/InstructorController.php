<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class InstructorController extends Controller
{
    public function index()
    {
        $instructors = User::role('instructor')->latest()->get();

        return Inertia::render('admin/instructors/index', ['instructors' => $instructors]);
    }

    public function create()
    {
        return Inertia::render('admin/instructors/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone_number' => 'required|string|max:255',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('instructor');

        return redirect()->route('instructors.index')->with('success', 'Instruktur berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $instructor = User::findOrFail($id);
        return Inertia::render('admin/instructors/edit', ['instructor' => $instructor]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $id,
            'phone_number' => 'required|string|max:255',
        ]);

        $instructor = User::findOrFail($id);
        $instructor->update($request->all());

        return redirect()->route('instructors.index')->with('success', 'Instruktur berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $instructor = User::findOrFail($id);
        $instructor->delete();
        return redirect()->route('instructors.index')->with('success', 'Instruktur berhasil dihapus.');
    }
}
