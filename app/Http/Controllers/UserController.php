<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::role('user')->latest()->get();

        return Inertia::render('admin/users/index', ['users' => $users]);
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


        $courseEnrollments = EnrollmentCourse::where('invoice_id', function ($query) use ($id) {
            $query->select('id')
                ->from('invoices')
                ->where('user_id', $id)
                ->where('status', 'paid');
        })
            ->with([
                'course:id,title,thumbnail,price,user_id',
                'course.user:id,name',
                'invoice:id,status,paid_at'
            ])
            ->get();

        $bootcampEnrollments = EnrollmentBootcamp::where('invoice_id', function ($query) use ($id) {
            $query->select('id')
                ->from('invoices')
                ->where('user_id', $id)
                ->where('status', 'paid');
        })
            ->with([
                'bootcamp:id,title,thumbnail,price,user_id',
                'bootcamp.user:id,name',
                'invoice:id,status,paid_at'
            ])
            ->get();

        $webinarEnrollments = EnrollmentWebinar::where('invoice_id', function ($query) use ($id) {
            $query->select('id')
                ->from('invoices')
                ->where('user_id', $id)
                ->where('status', 'paid');
        })
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
