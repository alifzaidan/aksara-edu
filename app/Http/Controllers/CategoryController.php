<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");
        }

        $totalCategories = Category::count();

        $statistics = [
            'total_categories' => $totalCategories,
        ];

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $categories = $query->paginate($perPage)->withQueryString();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/categories/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
        ]);

        $data = $request->all();

        Category::create($data);

        return redirect()->route('categories.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $category = Category::findOrFail($id);
        return Inertia::render('admin/categories/edit', ['category' => $category]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $id,
        ]);

        $category = Category::findOrFail($id);
        $category->update($request->all());

        return redirect()->route('categories.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);
        $category->delete();
        return redirect()->route('categories.index')->with('success', 'Kategori berhasil dihapus.');
    }
}
