<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
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
                },
                'webinars as total_webinars' => function ($query) {
                    $query->where('status', 'published');
                },
                'bootcamps as total_bootcamps' => function ($query) {
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
                    'total_webinars' => $mentor->total_webinars ?? 0,
                    'total_bootcamps' => $mentor->total_bootcamps ?? 0,
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

        $now = Carbon::now();

        $webinars = $mentor->webinars()
            ->where('status', 'published')
            ->with(['category'])
            ->latest('start_time')
            ->get()
            ->map(function ($webinar) use ($now) {
                $registrationDeadline = Carbon::parse($webinar->registration_deadline);
                $isRegistrationClosed = $now->greaterThan($registrationDeadline);

                return [
                    'id' => $webinar->id,
                    'title' => $webinar->title,
                    'slug' => $webinar->slug,
                    'thumbnail' => $webinar->thumbnail,
                    'category' => $webinar->category,
                    'price' => $webinar->price,
                    'strikethrough_price' => $webinar->strikethrough_price,
                    'start_time' => $webinar->start_time,
                    'end_time' => $webinar->end_time,
                    'batch' => $webinar->batch,
                    'registration_deadline' => $webinar->registration_deadline,
                    'is_registration_closed' => $isRegistrationClosed,
                ];
            });

        $bootcamps = $mentor->bootcamps()
            ->where('status', 'published')
            ->with(['category'])
            ->latest('start_date')
            ->get()
            ->map(function ($bootcamp) use ($now) {
                $registrationDeadline = Carbon::parse($bootcamp->registration_deadline);
                $isRegistrationClosed = $now->greaterThan($registrationDeadline);

                return [
                    'id' => $bootcamp->id,
                    'title' => $bootcamp->title,
                    'slug' => $bootcamp->slug,
                    'thumbnail' => $bootcamp->thumbnail,
                    'category' => $bootcamp->category,
                    'price' => $bootcamp->price,
                    'strikethrough_price' => $bootcamp->strikethrough_price,
                    'start_date' => $bootcamp->start_date,
                    'end_date' => $bootcamp->end_date,
                    'batch' => $bootcamp->batch,
                    'duration_weeks' => $bootcamp->duration_weeks,
                    'registration_deadline' => $bootcamp->registration_deadline,
                    'is_registration_closed' => $isRegistrationClosed,
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
            'webinars' => $webinars,
            'bootcamps' => $bootcamps,
            'stats' => [
                'total_courses' => $courses->count(),
                'total_articles' => $articles->count(),
                'total_webinars' => $webinars->count(),
                'total_bootcamps' => $bootcamps->count(),
            ],
        ]);
    }
}
