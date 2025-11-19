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
            ->latest()
            ->get()
            ->map(function ($mentor) {
                $mentor->total_earnings = $mentor->affiliate_earnings_sum_amount ?? 0;
                unset($mentor->affiliate_earnings_sum_amount);
                return $mentor;
            });

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
