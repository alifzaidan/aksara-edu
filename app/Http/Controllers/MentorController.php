<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\AffiliateWithdrawal;
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

        $withdrawals = AffiliateWithdrawal::where('affiliate_user_id', $mentor->id)
            ->orderBy('withdrawn_at', 'desc')
            ->get();

        $totalCommission = $earnings->sum('amount');
        $paidCommission = $withdrawals->sum('amount');
        $availableCommission = $totalCommission - $paidCommission;

        $courses = $mentor->courses()
            ->with(['category', 'tools'])
            ->withCount(['enrollmentCourses as students_count'])
            ->latest()
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->short_description ?? $course->description,
                    'thumbnail' => $course->thumbnail,
                    'price' => $course->price,
                    'status' => $course->status,
                    'level' => $course->level,
                    'category' => $course->category,
                    'duration' => $course->duration,
                    'students_count' => $course->students_count,
                    'created_at' => $course->created_at,
                ];
            });

        $articles = $mentor->articles()
            ->with(['category'])
            ->select('articles.*')
            ->latest()
            ->get()
            ->map(function ($article) {
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'slug' => $article->slug,
                    'thumbnail' => $article->thumbnail,
                    'category' => $article->category,
                    'excerpt' => $article->excerpt,
                    'status' => $article->status,
                    'views' => $article->views ?? 0,
                    'read_time' => $article->read_time,
                    'is_featured' => $article->is_featured,
                    'published_at' => $article->published_at,
                    'created_at' => $article->created_at,
                ];
            });

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

        $bootcamps = $mentor->bootcamps()
            ->with(['category', 'tools'])
            ->latest()
            ->get()
            ->map(function ($bootcamp) {
                return [
                    'id' => $bootcamp->id,
                    'title' => $bootcamp->title,
                    'slug' => $bootcamp->slug,
                    'thumbnail' => $bootcamp->thumbnail,
                    'category' => $bootcamp->category,
                    'price' => $bootcamp->price,
                    'discount_price' => $bootcamp->discount_price ?? null,
                    'batch' => $bootcamp->batch,
                    'status' => $bootcamp->status,
                    'start_date' => $bootcamp->start_date,
                    'end_date' => $bootcamp->end_date,
                ];
            });

        $stats = [
            'total_products' => $earnings->count(),
            'total_commission' => $totalCommission,
            'paid_commission' => $paidCommission,
            'available_commission' => $availableCommission,
        ];

        return Inertia::render('admin/mentors/show', [
            'mentor' => $mentor,
            'earnings' => $earnings,
            'withdrawals' => $withdrawals,
            'courses' => $courses,
            'articles' => $articles,
            'webinars' => $webinars,
            'bootcamps' => $bootcamps,
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

    public function withdrawCommission(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $mentor = User::findOrFail($id);
        $withdrawAmount = (int) $request->amount;

        $totalWithdrawn = AffiliateWithdrawal::where('affiliate_user_id', $mentor->id)->sum('amount');
        $totalCommission = AffiliateEarning::where('affiliate_user_id', $mentor->id)->sum('amount');
        $availableCommission = $totalCommission - $totalWithdrawn;

        if ($withdrawAmount > $availableCommission) {
            return back()->with('error', 'Nominal penarikan melebihi komisi yang tersedia.');
        }

        AffiliateWithdrawal::create([
            'affiliate_user_id' => $mentor->id,
            'amount' => $withdrawAmount,
            'withdrawn_at' => now(),
        ]);

        return back()->with('success', "Berhasil menarik komisi sebesar Rp " . number_format($withdrawAmount, 0, ',', '.') . " untuk {$mentor->name}.");
    }
}
