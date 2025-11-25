<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class MentorController extends Controller
{
    public function index()
    {
        $mentors = User::role('mentor')
            ->withSum('affiliateEarnings', 'amount')
            ->withCount('courses as total_courses')
            ->withCount('articles as total_articles')
            ->withCount('webinars as total_webinars')
            ->withCount('bootcamps as total_bootcamps')
            ->latest()
            ->get()
            ->map(function ($mentor) {
                $mentor->total_earnings = $mentor->affiliate_earnings_sum_amount ?? 0;
                unset($mentor->affiliate_earnings_sum_amount);
                return $mentor;
            });

        $totalMentors = $mentors->count();
        $activeMentors = $mentors->where('affiliate_status', 'Active')->count();
        $inactiveMentors = $mentors->where('affiliate_status', 'Not Active')->count();

        $totalCourses = $mentors->sum('total_courses');
        $totalArticles = $mentors->sum('total_articles');
        $totalWebinars = $mentors->sum('total_webinars');
        $totalBootcamps = $mentors->sum('total_bootcamps');

        $totalEarnings = $mentors->sum('total_earnings');

        $allEarnings = AffiliateEarning::whereIn('affiliate_user_id', $mentors->pluck('id'))->get();
        $paidCommission = $allEarnings->where('status', 'paid')->sum('amount');
        $pendingCommission = $allEarnings->where('status', 'approved')->sum('amount');

        $statistics = [
            'overview' => [
                'total_mentors' => $totalMentors,
                'active_mentors' => $activeMentors,
                'inactive_mentors' => $inactiveMentors,
            ],
            'content' => [
                'total_courses' => $totalCourses,
                'total_articles' => $totalArticles,
                'total_webinars' => $totalWebinars,
                'total_bootcamps' => $totalBootcamps,
            ],
            'earnings' => [
                'total_earnings' => $totalEarnings,
                'paid_commission' => $paidCommission,
                'pending_commission' => $pendingCommission,
            ],
        ];

        return Inertia::render('admin/mentors/index', [
            'mentors' => $mentors,
            'statistics' => $statistics,
        ]);
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
            'commission' => 'required|numeric|min:0',
        ]);

        $lastMentor = User::role('mentor')
            ->whereNotNull('affiliate_code')
            ->where('affiliate_code', 'like', 'MTR%')
            ->orderBy('affiliate_code', 'desc')
            ->first();

        if ($lastMentor && $lastMentor->affiliate_code) {
            $lastNumber = (int) substr($lastMentor->affiliate_code, 3);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        $mentorCode = 'MTR' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $request->name,
            'bio' => $request->bio,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'commission' => $request->commission,
            'affiliate_code' => $mentorCode,
            'affiliate_status' => 'Active',
            'email_verified_at' => now(),
        ]);

        $user->assignRole('mentor');

        return redirect()->route('mentors.index')->with('success', 'Mentor berhasil ditambahkan.');
    }

    public function show(string $id)
    {
        $mentor = User::findOrFail($id);
        $earnings = AffiliateEarning::with([
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
        ])
            ->where('affiliate_user_id', $mentor->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $courses = $mentor->courses()
            ->with(['category', 'tools'])
            ->withCount(['enrollmentCourses as students_count'])
            ->latest()
            ->get();

        $articles = $mentor->articles()
            ->with(['category'])
            ->withCount(['articleViews as views_count'])
            ->latest()
            ->get();

        $webinars = $mentor->webinars()
            ->with(['category', 'tools'])
            ->latest()
            ->get()
            ->map(function ($webinar) {
                return [
                    'id' => $webinar->id,
                    'title' => $webinar->title,
                    'slug' => $webinar->slug,
                    'thumbnail' => $webinar->thumbnail,
                    'category' => $webinar->category,
                    'price' => $webinar->price,
                    'discount_price' => $webinar->discount_price ?? null,
                    'quota' => $webinar->quota,
                    'status' => $webinar->status,
                    'start_time' => $webinar->start_time,
                    'batch' => $webinar->batch,
                ];
            });

        $stats = [
            'total_products' => $earnings->count(),
            'total_commission' => $earnings->sum('amount'),
            'paid_commission' => $earnings->where('status', 'paid')->sum('amount'),
            'available_commission' => $earnings->where('status', 'approved')->sum('amount'),
        ];

        return Inertia::render('admin/mentors/show', [
            'mentor' => $mentor,
            'earnings' => $earnings,
            'courses' => $courses,
            'articles' => $articles,
            'webinars' => $webinars,
            'stats' => $stats
        ]);
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
            'commission' => 'required|numeric|min:0',
        ]);

        $mentor = User::findOrFail($id);
        $mentor->update($request->all());

        return redirect()->route('mentors.show', $mentor->id)->with('success', 'Mentor berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $mentor = User::findOrFail($id);
        $mentor->delete();
        return redirect()->route('mentors.index')->with('success', 'Mentor berhasil dihapus.');
    }
}
