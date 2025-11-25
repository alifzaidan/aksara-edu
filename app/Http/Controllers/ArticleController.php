<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAffiliate = $user->hasRole('affiliate');

        $query = Article::with(['category', 'user'])->latest();

        if ($user->hasRole('mentor')) {
            $query->where('user_id', $user->id);
        } elseif ($isAffiliate) {
            $query->where('status', 'published');
        }

        $articles = $query->get();

        $totalArticles = $articles->count();

        $draftArticles = $articles->where('status', 'draft')->count();
        $publishedArticles = $articles->where('status', 'published')->count();
        $archivedArticles = $articles->where('status', 'archived')->count();

        $featuredArticles = $articles->where('is_featured', true)->count();

        $totalViews = $articles->sum('views');
        $averageViews = $totalArticles > 0 ? round($totalViews / $totalArticles, 0) : 0;

        $mostViewedArticles = $articles->sortByDesc('views')->take(3)->map(function ($article) {
            return [
                'id' => $article->id,
                'title' => $article->title,
                'views' => $article->views,
                'thumbnail' => $article->thumbnail,
            ];
        })->values();

        $totalReadTime = $articles->sum('read_time');
        $averageReadTime = $totalArticles > 0 ? round($totalReadTime / $totalArticles, 1) : 0;

        $categoryDistribution = $articles->groupBy('category_id')->map(function ($group) {
            return [
                'category_name' => $group->first()->category->name,
                'count' => $group->count(),
            ];
        })->sortByDesc('count')->take(5)->values();

        $authorStats = $articles->groupBy('user_id')->map(function ($group) {
            return [
                'author_name' => $group->first()->user->name,
                'article_count' => $group->count(),
                'total_views' => $group->sum('views'),
            ];
        })->sortByDesc('article_count')->take(3)->values();

        $recentArticles = $articles->filter(function ($article) {
            return Carbon::parse($article->created_at)->isAfter(now()->subDays(30));
        })->count();

        $publishedThisMonth = $articles->filter(function ($article) {
            return $article->published_at &&
                Carbon::parse($article->published_at)->isSameMonth(now());
        })->count();

        $withoutThumbnail = $articles->whereNull('thumbnail')->count();

        $statistics = [
            'overview' => [
                'total_articles' => $totalArticles,
                'draft_articles' => $draftArticles,
                'published_articles' => $publishedArticles,
                'archived_articles' => $archivedArticles,
                'featured_articles' => $featuredArticles,
                'recent_articles' => $recentArticles,
            ],
            'engagement' => [
                'total_views' => $totalViews,
                'average_views' => $averageViews,
                'most_viewed' => $mostViewedArticles,
            ],
            'content' => [
                'total_read_time' => $totalReadTime,
                'average_read_time' => $averageReadTime,
                'without_thumbnail' => $withoutThumbnail,
            ],
            'distribution' => [
                'categories' => $categoryDistribution,
                'authors' => $authorStats,
            ],
            'activity' => [
                'published_this_month' => $publishedThisMonth,
            ],
        ];

        return Inertia::render('admin/articles/index', [
            'articles' => $articles,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        return Inertia::render('admin/articles/create', ['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'read_time' => 'nullable|integer|min:0',
        ]);

        $data = $request->all();

        // Generate unique slug
        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Article::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('article_thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            $data['thumbnail'] = null;
        }

        // Set author
        $data['user_id'] = $request->user()->id;

        // Set default status
        $data['status'] = 'draft';

        // Auto-calculate read time if not provided
        if (!isset($data['read_time']) || $data['read_time'] == 0) {
            $wordCount = str_word_count(strip_tags($data['content'] ?? ''));
            $data['read_time'] = max(1, ceil($wordCount / 200)); // Average reading speed: 200 words/minute
        }

        $article = Article::create($data);

        return redirect()->route('articles.index')->with('success', 'Artikel berhasil dibuat.');
    }

    public function show(string $id)
    {
        $article = Article::with(['category', 'user'])->findOrFail($id);

        return Inertia::render('admin/articles/show', [
            'article' => $article,
        ]);
    }

    public function edit(string $id)
    {
        $article = Article::findOrFail($id);
        $categories = Category::all();

        return Inertia::render('admin/articles/edit', [
            'article' => $article,
            'categories' => $categories
        ]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'read_time' => 'nullable|integer|min:0',
        ]);

        $article = Article::findOrFail($id);
        $data = $request->all();

        // Generate unique slug if title changed
        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Article::where('slug', $slug)->where('id', '!=', $article->id)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        // Handle thumbnail
        if ($request->hasFile('thumbnail')) {
            if ($article->thumbnail) {
                Storage::disk('public')->delete($article->thumbnail);
            }
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('article_thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            unset($data['thumbnail']);
        }

        // Auto-calculate read time if not provided
        if (!isset($data['read_time']) || $data['read_time'] == 0) {
            $wordCount = str_word_count(strip_tags($data['content'] ?? ''));
            $data['read_time'] = max(1, ceil($wordCount / 200));
        }

        $article->update($data);

        return redirect()->route('articles.show', $article->id)->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $article = Article::findOrFail($id);

        // Delete thumbnail if exists
        if ($article->thumbnail) {
            Storage::disk('public')->delete($article->thumbnail);
        }

        $article->delete();

        return redirect()->route('articles.index')->with('success', 'Artikel berhasil dihapus.');
    }

    public function duplicate(string $id)
    {
        $article = Article::findOrFail($id);

        $newArticle = $article->replicate();

        // Duplicate thumbnail if exists
        if ($article->thumbnail && Storage::disk('public')->exists($article->thumbnail)) {
            $originalPath = $article->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'article_thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newArticle->thumbnail = $newFileName;
        } else {
            $newArticle->thumbnail = null;
        }

        // Generate unique slug
        $slug = Str::slug($newArticle->title);
        $originalSlug = $slug;
        $counter = 1;
        while (Article::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newArticle->slug = $slug;
        $newArticle->status = 'draft';
        $newArticle->views = 0;
        $newArticle->published_at = null;
        $newArticle->save();

        return redirect()->route('articles.show', $newArticle->id)
            ->with('success', 'Artikel berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(Request $request, string $id)
    {
        if (!$request->user()->hasRole('admin')) {
            return back()->with('error', 'Anda tidak memiliki izin untuk menerbitkan artikel. Silakan hubungi admin.');
        }

        $article = Article::findOrFail($id);
        $article->status = 'published';
        $article->published_at = now();
        $article->save();

        return back()->with('success', 'Artikel berhasil dipublikasikan.');
    }

    public function archive(Request $request, string $id)
    {
        if (!$request->user()->hasRole('admin')) {
            return back()->with('error', 'Anda tidak memiliki izin untuk mengarsipkan artikel. Silakan hubungi admin.');
        }

        $article = Article::findOrFail($id);
        $article->status = 'archived';
        $article->save();

        return back()->with('success', 'Artikel berhasil diarsipkan.');
    }
}
