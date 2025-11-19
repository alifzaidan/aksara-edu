<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MentorController extends Controller
{
    public function index()
    {
        $mentors = User::role('mentor')
            ->withCount([
                'courses as total_courses' => function ($query) {
                    $query->where('status', 'published');
                },
                'articles as total_articles' => function ($query) {
                    $query->where('status', 'published');
                }
            ])
            ->get()
            ->map(function ($mentor) {
                return [
                    'id' => $mentor->id,
                    'name' => $mentor->name,
                    'bio' => $mentor->bio,
                    'avatar' => $mentor->avatar,
                    'total_courses' => $mentor->total_courses ?? 0,
                    'total_articles' => $mentor->total_articles ?? 0,
                ];
            });

        return Inertia::render('user/mentor/index', [
            'mentors' => $mentors,
        ]);
    }

    public function show(string $id)
    {
        $mentor = User::role('mentor')->findOrFail($id);

        $courses = $mentor->courses()
            ->where('status', 'published')
            ->with(['category'])
            ->withCount('enrollmentCourses as students_count')
            ->withAvg('courseRatings as rating', 'rating')
            ->latest('created_at')
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'thumbnail' => $course->thumbnail,
                    'category' => $course->category,
                    'price' => $course->price,
                    'discount_price' => $course->discount_price,
                    'level' => $course->level,
                    'students_count' => $course->students_count ?? 0,
                    'rating' => round($course->rating ?? 0, 1),
                ];
            });

        $articles = $mentor->articles()
            ->where('status', 'published')
            ->with(['category'])
            ->latest('published_at')
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'excerpt' => $article->excerpt,
                    'thumbnail' => $article->thumbnail,
                    'category' => $article->category,
                    'read_time' => $article->read_time,
                    'views' => $article->views,
                    'published_at' => $article->published_at,
                ];
            });

        return Inertia::render('user/mentor/show', [
            'mentor' => [
                'id' => $mentor->id,
                'name' => $mentor->name,
                'bio' => $mentor->bio,
                'avatar' => $mentor->avatar,
                'email' => $mentor->email,
                'phone_number' => $mentor->phone_number,
            ],
            'courses' => $courses,
            'articles' => $articles,
            'stats' => [
                'total_courses' => $courses->count(),
                'total_articles' => $articles->count(),
                'total_students' => $courses->sum('students_count'),
            ],
        ]);
    }
}
