<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::role('user')
            ->withCount([
                'courseEnrollments as courses_count' => function ($query) {
                    $query->whereHas('invoice', function ($q) {
                        $q->where('status', 'paid');
                    });
                },
                'bootcampEnrollments as bootcamps_count' => function ($query) {
                    $query->whereHas('invoice', function ($q) {
                        $q->where('status', 'paid');
                    });
                },
                'webinarEnrollments as webinars_count' => function ($query) {
                    $query->whereHas('invoice', function ($q) {
                        $q->where('status', 'paid');
                    });
                }
            ])
            ->with(['invoices' => function ($query) {
                $query->where('status', 'paid')
                    ->with([
                        'courseItems.course:id,title,price',
                        'bootcampItems.bootcamp:id,title,price',
                        'webinarItems.webinar:id,title,price'
                    ])
                    ->latest('paid_at')
                    ->limit(1);
            }])
            ->latest()
            ->get();

        $usersData = $users->map(function ($user) {
            $lastPurchase = $user->invoices->first();

            $purchasedItems = [];
            if ($lastPurchase) {
                foreach ($lastPurchase->courseItems as $item) {
                    $purchasedItems[] = [
                        'type' => 'course',
                        'title' => $item->course->title,
                        'price' => $item->course->price,
                    ];
                }
                foreach ($lastPurchase->bootcampItems as $item) {
                    $purchasedItems[] = [
                        'type' => 'bootcamp',
                        'title' => $item->bootcamp->title,
                        'price' => $item->bootcamp->price,
                    ];
                }
                foreach ($lastPurchase->webinarItems as $item) {
                    $purchasedItems[] = [
                        'type' => 'webinar',
                        'title' => $item->webinar->title,
                        'price' => $item->webinar->price,
                    ];
                }
            }

            $programTypes = [];
            if ($user->courses_count > 0) $programTypes[] = 'course';
            if ($user->bootcamps_count > 0) $programTypes[] = 'bootcamp';
            if ($user->webinars_count > 0) $programTypes[] = 'webinar';

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'courses_count' => $user->courses_count,
                'bootcamps_count' => $user->bootcamps_count,
                'webinars_count' => $user->webinars_count,
                'total_enrollments' => $user->courses_count + $user->bootcamps_count + $user->webinars_count,
                'program_types' => $programTypes,
                'last_purchase_date' => $lastPurchase?->paid_at,
                'last_purchase_items' => $purchasedItems,
                'last_purchase_total' => $lastPurchase?->nett_amount,
                'has_enrollments' => ($user->courses_count + $user->bootcamps_count + $user->webinars_count) > 0,
            ];
        });

        // ✅ Simplified Statistics
        $totalUsers = $users->count();
        $verifiedUsers = $users->whereNotNull('email_verified_at')->count();
        $unverifiedUsers = $users->whereNull('email_verified_at')->count();

        // Active users (have at least one enrollment)
        $activeUsers = $usersData->where('has_enrollments', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;

        // Users with purchases
        $usersWithPurchases = $usersData->whereNotNull('last_purchase_date')->count();

        // Get all paid invoices for revenue calculation
        $allInvoices = Invoice::where('status', 'paid')->get();
        $totalRevenue = $allInvoices->sum('nett_amount');
        $averageRevenuePerUser = $usersWithPurchases > 0 ? $totalRevenue / $usersWithPurchases : 0;

        $statistics = [
            'overview' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'inactive_users' => $inactiveUsers,
                'verified_users' => $verifiedUsers,
                'unverified_users' => $unverifiedUsers,
                'activity_rate' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
            ],
            'purchases' => [
                'users_with_purchases' => $usersWithPurchases,
                'avg_revenue_per_user' => round($averageRevenuePerUser, 0),
                'conversion_rate' => $totalUsers > 0 ? round(($usersWithPurchases / $totalUsers) * 100, 1) : 0,
            ],
        ];

        return Inertia::render('admin/users/index', [
            'users' => $usersData,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/create');
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
            'email_verified_at' => now(),
        ]);

        $user->assignRole('user');

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function show(string $id, Request $request)
    {
        $user = User::with(['roles'])->findOrFail($id);

        $invoicesPage = $request->input('invoices_page', 1);
        $enrollmentsPage = $request->input('enrollments_page', 1);
        $perPage = 5;

        $invoices = Invoice::where('user_id', $id)
            ->with([
                'courseItems.course:id,title,thumbnail,price,user_id',
                'courseItems.course.user:id,name',
                'bootcampItems.bootcamp:id,title,thumbnail,price,user_id',
                'bootcampItems.bootcamp.user:id,name',
                'webinarItems.webinar:id,title,thumbnail,price,user_id',
                'webinarItems.webinar.user:id,name'
            ])
            ->latest()
            ->paginate($perPage, ['*'], 'invoices_page', $invoicesPage);

        $paidInvoiceIds = Invoice::where('user_id', $id)
            ->where('status', 'paid')
            ->pluck('id');

        $courseEnrollments = EnrollmentCourse::whereIn('invoice_id', $paidInvoiceIds)
            ->with([
                'course:id,title,thumbnail,price,user_id',
                'course.user:id,name',
                'invoice:id,status,paid_at'
            ])
            ->get();

        $bootcampEnrollments = EnrollmentBootcamp::whereIn('invoice_id', $paidInvoiceIds)
            ->with([
                'bootcamp:id,title,thumbnail,price,user_id',
                'bootcamp.user:id,name',
                'invoice:id,status,paid_at'
            ])
            ->get();

        $webinarEnrollments = EnrollmentWebinar::whereIn('invoice_id', $paidInvoiceIds)
            ->with([
                'webinar:id,title,thumbnail,price,user_id',
                'webinar.user:id,name',
                'invoice:id,status,paid_at'
            ])
            ->get();

        $allEnrollments = collect([
            ...$courseEnrollments->map(fn($e) => [...$e->toArray(), 'type' => 'course']),
            ...$bootcampEnrollments->map(fn($e) => [...$e->toArray(), 'type' => 'bootcamp']),
            ...$webinarEnrollments->map(fn($e) => [...$e->toArray(), 'type' => 'webinar']),
        ])->sortByDesc('created_at');

        $enrollmentsTotal = $allEnrollments->count();
        $enrollmentsOffset = ($enrollmentsPage - 1) * $perPage;
        $paginatedEnrollments = $allEnrollments->slice($enrollmentsOffset, $perPage)->values();

        $enrollmentsPagination = [
            'data' => $paginatedEnrollments,
            'current_page' => (int) $enrollmentsPage,
            'per_page' => $perPage,
            'total' => $enrollmentsTotal,
            'last_page' => ceil($enrollmentsTotal / $perPage),
            'from' => $enrollmentsOffset + 1,
            'to' => min($enrollmentsOffset + $perPage, $enrollmentsTotal),
        ];

        $allInvoices = Invoice::where('user_id', $id)->get();
        $stats = [
            'total_spent' => $allInvoices->where('status', 'paid')->sum('nett_amount'),
            'total_transactions' => $allInvoices->where('status', 'paid')->count(),
            'total_courses' => $courseEnrollments->count(),
            'total_bootcamps' => $bootcampEnrollments->count(),
            'total_webinars' => $webinarEnrollments->count(),
            'completed_courses' => $courseEnrollments->where('progress', 100)->count(),
            'active_courses' => $courseEnrollments->where('progress', '<', 100)->count(),
        ];

        return Inertia::render('admin/users/show', [
            'user' => $user,
            'invoices' => $invoices,
            'enrollments' => $enrollmentsPagination,
            'stats' => $stats
        ]);
    }

    public function edit(string $id)
    {
        $user = User::findOrFail($id);
        return Inertia::render('admin/users/edit', ['user' => $user]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $id,
            'phone_number' => 'required|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $user->update($request->all());

        return redirect()->route('users.index')->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return redirect()->route('users.index')->with('success', 'Pengguna berhasil dihapus.');
    }
}
