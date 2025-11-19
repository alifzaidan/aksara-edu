<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $query = Article::with(['category', 'user'])
            ->where('status', 'published');

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category_id', $request->category);
        }

        // Sort articles
        if ($request->has('sort') && $request->sort === 'popular') {
            $query->orderBy('views', 'desc')->orderBy('published_at', 'desc');
        } else {
            $query->latest('published_at');
        }

        $articles = $query->paginate(12)->through(function ($article) {
            return [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'thumbnail' => $article->thumbnail,
                'category' => [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                ],
                'user' => [
                    'id' => $article->user->id,
                    'name' => $article->user->name,
                ],
                'read_time' => $article->read_time,
                'views' => $article->views,
                'published_at' => $article->published_at?->format('Y-m-d H:i:s'),
            ];
        });

        $categories = Category::withCount(['articles' => function ($query) {
            $query->where('status', 'published');
        }])
            ->having('articles_count', '>', 0)
            ->get();

        $popularArticles = Article::where('status', 'published')
            ->orderBy('views', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'views', 'thumbnail']);

        return Inertia::render('user/article/index', [
            'articles' => $articles,
            'categories' => $categories,
            'popularArticles' => $popularArticles,
            'filters' => [
                'category' => $request->category,
                'sort' => $request->sort ?? 'latest',
            ],
        ]);
    }

    public function show(Request $request, string $slug)
    {
        $article = Article::with(['category', 'user'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $cookieName = 'article_viewed_' . $article->id;
        $hasViewed = $request->cookie($cookieName);

        if (!$hasViewed) {
            $article->incrementViews();

            // Set cookie untuk 7 hari
            Cookie::queue($cookieName, true, 60 * 24 * 7);
        }

        $relatedArticles = Article::where('category_id', $article->category_id)
            ->where('id', '!=', $article->id)
            ->where('status', 'published')
            ->latest('published_at')
            ->limit(3)
            ->get(['id', 'title', 'slug', 'excerpt', 'thumbnail', 'read_time', 'published_at']);

        return Inertia::render('user/article/show', [
            'article' => [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'content' => $article->content,
                'thumbnail' => $article->thumbnail,
                'category' => [
                    'id' => $article->category->id,
                    'name' => $article->category->name,
                ],
                'user' => [
                    'id' => $article->user->id,
                    'name' => $article->user->name,
                    'bio' => $article->user->bio,
                    'avatar' => $article->user->avatar,
                ],
                'read_time' => $article->read_time,
                'views' => $article->views,
                'published_at' => $article->published_at?->format('Y-m-d H:i:s'),
                'created_at' => $article->created_at->format('Y-m-d H:i:s'),
            ],
            'relatedArticles' => $relatedArticles,
        ]);
    }
}
