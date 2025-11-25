<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ToolController extends Controller
{
    public function index()
    {
        $tools = Tool::latest()->get();

        $statistics = [
            'total_tools' => $tools->count(),
        ];

        return Inertia::render('admin/tools/index', ['tools' => $tools, 'statistics' => $statistics]);
    }

    public function create()
    {
        return Inertia::render('admin/tools/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tools,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $data = $request->all();

        if ($request->hasFile('icon')) {
            $icon = $request->file('icon');
            $iconPath = $icon->store('icons', 'public');
            $data['icon'] = $iconPath;
        } else {
            $data['icon'] = null;
        }

        Tool::create($data);

        return redirect()->route('tools.index')->with('success', 'Tool berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $tool = Tool::findOrFail($id);
        return Inertia::render('admin/tools/edit', ['tool' => $tool]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tools,slug,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $tool = Tool::findOrFail($id);

        $data = $request->only(['name', 'slug', 'description']);

        if ($request->hasFile('icon')) {
            if ($tool->icon) {
                Storage::disk('public')->delete($tool->icon);
            }
            $icon = $request->file('icon');
            $iconPath = $icon->store('icons', 'public');
            $data['icon'] = $iconPath;
        } else {
            unset($data['icon']);
        }

        $tool->update($data);

        return redirect()->route('tools.index')->with('success', 'Tool berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $tool = Tool::findOrFail($id);
        $tool->delete();
        return redirect()->route('tools.index')->with('success', 'Tool berhasil dihapus.');
    }
}
