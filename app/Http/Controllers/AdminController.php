<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\Article;
use App\Models\Bootcamp;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Webinar;
use Carbon\Carbon;
use Database\Seeders\StaffPermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $user = User::find(Auth::user()->id);
        $role = $user->hasRole('admin') ? 'admin' : ($user->hasRole('staff') ? 'staff' : ($user->hasRole('affiliate') ? 'affiliate' : 'mentor'));
        $stats = [];

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        switch ($role) {
            case 'admin':
                $stats = $this->getAdminStats($startDate, $endDate);
                break;
            case 'staff':
                $stats = $this->getStaffStats($user, $startDate, $endDate);
                break;
            case 'affiliate':
                $stats = $this->getAffiliateStats($user, $startDate, $endDate);
                break;
            case 'mentor':
                $stats = $this->getMentorStats($user, $startDate, $endDate);
                break;
        }

        return Inertia::render('admin/dashboard/index', [
            'stats' => $stats,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Base query untuk semua transaksi yang benar-benar dibayar (mencegah double-count cicilan)
     * - Pembelian reguler: invoice non-cicilan status paid (parent_invoice_id IS NULL AND is_installment = false)
     * - Pembayaran cicilan: invoice anak termin status paid (parent_invoice_id IS NOT NULL)
     */
    private function paidPaymentsQuery()
    {
        return Invoice::where('status', 'paid')
            ->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('parent_invoice_id')->where('is_installment', false);
                })->orWhereNotNull('parent_invoice_id');
            });
    }

    private function getRevenueData()
    {
        return $this->paidPaymentsQuery()
            ->select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(nett_amount) as total_amount'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->whereDate('paid_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();
    }

    private function getMonthlyRevenueData()
    {
        return $this->paidPaymentsQuery()
            ->select(
                DB::raw('YEAR(paid_at) as year'),
                DB::raw('MONTH(paid_at) as month'),
                DB::raw('SUM(nett_amount) as total_amount'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->whereDate('paid_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($item) {
                $monthNames = [
                    1 => 'Jan',
                    2 => 'Feb',
                    3 => 'Mar',
                    4 => 'Apr',
                    5 => 'Mei',
                    6 => 'Jun',
                    7 => 'Jul',
                    8 => 'Ags',
                    9 => 'Sep',
                    10 => 'Okt',
                    11 => 'Nov',
                    12 => 'Des'
                ];

                return [
                    'month' => $monthNames[$item->month],
                    'year' => $item->year,
                    'month_year' => $monthNames[$item->month] . ' ' . $item->year,
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                ];
            });
    }

    private function getParticipantData()
    {
        $courseEnrollments = EnrollmentCourse::join('invoices', 'enrollment_courses.invoice_id', '=', 'invoices.id')
            ->select(
                DB::raw('DATE(enrollment_courses.created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('"course" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereDate('enrollment_courses.created_at', '>=', now()->subDays(30))
            ->groupBy('date');

        $bootcampEnrollments = EnrollmentBootcamp::join('invoices', 'enrollment_bootcamps.invoice_id', '=', 'invoices.id')
            ->select(
                DB::raw('DATE(enrollment_bootcamps.created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('"bootcamp" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereDate('enrollment_bootcamps.created_at', '>=', now()->subDays(30))
            ->groupBy('date');

        $webinarEnrollments = EnrollmentWebinar::join('invoices', 'enrollment_webinars.invoice_id', '=', 'invoices.id')
            ->select(
                DB::raw('DATE(enrollment_webinars.created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('"webinar" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereDate('enrollment_webinars.created_at', '>=', now()->subDays(30))
            ->groupBy('date');

        $certEnrollments = EnrollmentCertificationProgram::join('invoices', 'enrollment_certification_programs.invoice_id', '=', 'invoices.id')
            ->select(
                DB::raw('DATE(enrollment_certification_programs.created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('"certification_program" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereDate('enrollment_certification_programs.created_at', '>=', now()->subDays(30))
            ->groupBy('date');

        return $courseEnrollments
            ->union($bootcampEnrollments)
            ->union($webinarEnrollments)
            ->union($certEnrollments)
            ->orderBy('date', 'desc')
            ->get();
    }

    private function getPopularProducts()
    {
        $popularCourses = DB::table('enrollment_courses')
            ->join('invoices', 'enrollment_courses.invoice_id', '=', 'invoices.id')
            ->join('courses', 'enrollment_courses.course_id', '=', 'courses.id')
            ->select(
                'courses.id as product_id',
                'courses.title',
                'courses.thumbnail',
                'courses.price',
                DB::raw('COUNT(*) as enrollment_count'),
                DB::raw('"course" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->groupBy('courses.id', 'courses.title', 'courses.thumbnail', 'courses.price')
            ->get();

        $popularBootcamps = DB::table('enrollment_bootcamps')
            ->join('invoices', 'enrollment_bootcamps.invoice_id', '=', 'invoices.id')
            ->join('bootcamps', 'enrollment_bootcamps.bootcamp_id', '=', 'bootcamps.id')
            ->select(
                'bootcamps.id as product_id',
                'bootcamps.title',
                'bootcamps.thumbnail',
                'bootcamps.price',
                DB::raw('COUNT(*) as enrollment_count'),
                DB::raw('"bootcamp" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->groupBy('bootcamps.id', 'bootcamps.title', 'bootcamps.thumbnail', 'bootcamps.price')
            ->get();

        $popularWebinars = DB::table('enrollment_webinars')
            ->join('invoices', 'enrollment_webinars.invoice_id', '=', 'invoices.id')
            ->join('webinars', 'enrollment_webinars.webinar_id', '=', 'webinars.id')
            ->select(
                'webinars.id as product_id',
                'webinars.title',
                'webinars.thumbnail',
                'webinars.price',
                DB::raw('COUNT(*) as enrollment_count'),
                DB::raw('"webinar" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->groupBy('webinars.id', 'webinars.title', 'webinars.thumbnail', 'webinars.price')
            ->get();

        $popularCertifications = DB::table('enrollment_certification_programs')
            ->join('invoices', 'enrollment_certification_programs.invoice_id', '=', 'invoices.id')
            ->join('certification_programs', 'enrollment_certification_programs.certification_program_id', '=', 'certification_programs.id')
            ->select(
                'certification_programs.id as product_id',
                'certification_programs.title',
                'certification_programs.thumbnail',
                'certification_programs.price',
                DB::raw('COUNT(*) as enrollment_count'),
                DB::raw('"certification_program" as type')
            )
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->groupBy('certification_programs.id', 'certification_programs.title', 'certification_programs.thumbnail', 'certification_programs.price')
            ->get();

        // Gabungkan semua data dan konversi ke array
        $allProducts = collect([])
            ->merge($popularCourses->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'enrollment_count' => (int) $item->enrollment_count,
                    'thumbnail' => $item->thumbnail,
                    'price' => (float) $item->price,
                ];
            }))
            ->merge($popularBootcamps->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'enrollment_count' => (int) $item->enrollment_count,
                    'thumbnail' => $item->thumbnail,
                    'price' => (float) $item->price,
                ];
            }))
            ->merge($popularWebinars->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'enrollment_count' => (int) $item->enrollment_count,
                    'thumbnail' => $item->thumbnail,
                    'price' => (float) $item->price,
                ];
            }))
            ->merge($popularCertifications->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'title' => $item->title,
                    'type' => 'certification_program',
                    'enrollment_count' => (int) $item->enrollment_count,
                    'thumbnail' => $item->thumbnail,
                    'price' => (float) $item->price,
                ];
            }))
            ->sortByDesc('enrollment_count')
            ->take(10)
            ->values()
            ->toArray();

        return $allProducts;
    }

    private function getAdminStats($startDate = null, $endDate = null)
    {
        $currentMonthStart = now()->copy()->startOfMonth();
        $currentMonthEnd = $currentMonthStart->copy()->endOfMonth();
        $previousMonthStart = $currentMonthStart->copy()->subMonthNoOverflow()->startOfMonth();
        $previousMonthEnd = $currentMonthStart->copy()->subMonthNoOverflow()->endOfMonth();

        $invoiceQuery = $this->paidPaymentsQuery();

        if ($startDate && $endDate) {
            $invoiceQuery->whereBetween('paid_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }

        $totalRevenue = (clone $invoiceQuery)->sum('nett_amount');

        $enrollmentCourseQuery = EnrollmentCourse::join('invoices', 'enrollment_courses.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereNull('invoices.parent_invoice_id');

        $enrollmentBootcampQuery = EnrollmentBootcamp::join('invoices', 'enrollment_bootcamps.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereNull('invoices.parent_invoice_id');

        $enrollmentWebinarQuery = EnrollmentWebinar::join('invoices', 'enrollment_webinars.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereNull('invoices.parent_invoice_id');

        $enrollmentCertQuery = EnrollmentCertificationProgram::join('invoices', 'enrollment_certification_programs.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereNull('invoices.parent_invoice_id');

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
            $enrollmentCourseQuery->whereBetween('enrollment_courses.created_at', [$start, $end]);
            $enrollmentBootcampQuery->whereBetween('enrollment_bootcamps.created_at', [$start, $end]);
            $enrollmentWebinarQuery->whereBetween('enrollment_webinars.created_at', [$start, $end]);
            $enrollmentCertQuery->whereBetween('enrollment_certification_programs.created_at', [$start, $end]);
        }

        $totalParticipantsPaid = $enrollmentCourseQuery->count() +
            $enrollmentBootcampQuery->count() +
            $enrollmentWebinarQuery->count() +
            $enrollmentCertQuery->count();

        $participantsThisMonthPaid = EnrollmentCourse::join('invoices', 'enrollment_courses.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereMonth('enrollment_courses.created_at', now()->month)
            ->whereYear('enrollment_courses.created_at', now()->year)->count() +
            EnrollmentBootcamp::join('invoices', 'enrollment_bootcamps.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereMonth('enrollment_bootcamps.created_at', now()->month)
            ->whereYear('enrollment_bootcamps.created_at', now()->year)->count() +
            EnrollmentWebinar::join('invoices', 'enrollment_webinars.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereMonth('enrollment_webinars.created_at', now()->month)
            ->whereYear('enrollment_webinars.created_at', now()->year)->count() +
            EnrollmentCertificationProgram::join('invoices', 'enrollment_certification_programs.invoice_id', '=', 'invoices.id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere('invoices.status', 'installment_pending');
            })
            ->whereMonth('enrollment_certification_programs.created_at', now()->month)
            ->whereYear('enrollment_certification_programs.created_at', now()->year)->count();

        $revenueToday = $this->paidPaymentsQuery()
            ->whereDate('paid_at', today())
            ->sum('nett_amount');

        $revenueYesterday = $this->paidPaymentsQuery()
            ->whereDate('paid_at', now()->subDay())
            ->sum('nett_amount');

        $dailyRevenueChange = 0;
        if ($revenueYesterday > 0) {
            $dailyRevenueChange = (($revenueToday - $revenueYesterday) / $revenueYesterday) * 100;
        } elseif ($revenueToday > 0) {
            $dailyRevenueChange = 100;
        }

        $revenueThisMonth = $this->paidPaymentsQuery()
            ->whereBetween('paid_at', [$currentMonthStart, $currentMonthEnd])
            ->sum('nett_amount');

        $revenueLastMonth = $this->paidPaymentsQuery()
            ->whereBetween('paid_at', [$previousMonthStart, $previousMonthEnd])
            ->sum('nett_amount');

        $monthlyRevenueChange = 0;
        if ($revenueLastMonth > 0) {
            $monthlyRevenueChange = (($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100;
        } elseif ($revenueThisMonth > 0) {
            $monthlyRevenueChange = 100;
        }

        return [
            'total_revenue' => $totalRevenue,
            'revenue_this_month' => $revenueThisMonth,
            'revenue_today' => $revenueToday,
            'revenue_yesterday' => $revenueYesterday,
            'revenue_last_month' => $revenueLastMonth,
            'daily_revenue_change' => round($dailyRevenueChange, 1),
            'monthly_revenue_change' => round($monthlyRevenueChange, 1),
            'total_participants' => $totalParticipantsPaid,
            'participants_this_month' => $participantsThisMonthPaid,
            'total_users' => User::role('user')->count(),
            'new_users_last_week' => User::role('user')->where('created_at', '>=', now()->subWeek())->count(),
            'total_mentors' => User::role('mentor')->count(),
            'new_mentors_last_week' => User::role('mentor')->where('created_at', '>=', now()->subWeek())->count(),
            'total_affiliates' => User::role('affiliate')->count(),
            'new_affiliates_last_week' => User::role('affiliate')->where('created_at', '>=', now()->subWeek())->count(),
            'total_courses' => Course::count(),
            'total_bootcamps' => Bootcamp::count(),
            'total_webinars' => Webinar::count(),
            'recent_sales' => Invoice::with([
                'user',
                'courseItems.course',
                'bootcampItems.bootcamp',
                'webinarItems.webinar',
                'bundleEnrollments.bundle',
                'certificationProgramItems.certificationProgram',
                'parentInvoice.courseItems.course',
                'parentInvoice.bootcampItems.bootcamp',
                'parentInvoice.webinarItems.webinar',
                'parentInvoice.bundleEnrollments.bundle',
                'parentInvoice.certificationProgramItems.certificationProgram',
            ])
                ->whereNull('parent_invoice_id') // Hanya invoice induk, bukan anak cicilan
                ->where(function ($q) {
                    $q->whereIn('status', ['paid', 'completed'])
                        ->orWhere(function ($iq) {
                            // Parent installment yang sudah DP (termin 1 terbayar)
                            $iq->where('status', 'installment_pending')
                                ->whereHas('installmentTerms', fn ($tq) => $tq->where('installment_number', 1)->where('status', 'paid'));
                        });
                })
                ->orderByRaw('COALESCE(paid_at, created_at) DESC')
                ->take(5)
                ->get(),
            'revenue_data' => $this->getRevenueData(),
            'monthly_revenue_data' => $this->getMonthlyRevenueData(),
            'participant_data' => $this->getParticipantData(),
            'popular_products' => $this->getPopularProducts(),
            'filtered_date_range' => $startDate && $endDate ? [
                'start' => Carbon::parse($startDate)->format('d M Y'),
                'end' => Carbon::parse($endDate)->format('d M Y')
            ] : null,
        ];
    }

    private function getAffiliateStats(User $user, $startDate = null, $endDate = null)
    {
        $currentMonthStart = now()->copy()->startOfMonth();
        $currentMonthEnd = $currentMonthStart->copy()->endOfMonth();
        $previousMonthStart = $currentMonthStart->copy()->subMonthNoOverflow()->startOfMonth();
        $previousMonthEnd = $currentMonthStart->copy()->subMonthNoOverflow()->endOfMonth();

        // Query dasar untuk earnings affiliate
        $earningsQuery = AffiliateEarning::where('affiliate_user_id', $user->id);

        // Total commission (dengan filter jika ada)
        $totalCommissionQuery = clone $earningsQuery;
        if ($startDate && $endDate) {
            $totalCommissionQuery->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }
        $totalCommission = $totalCommissionQuery->sum('amount');

        // Commission bulan ini
        $monthlyCommission = (clone $earningsQuery)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->sum('amount');

        // Commission bulan lalu
        $lastMonthCommission = (clone $earningsQuery)
            ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
            ->sum('amount');

        // Commission hari ini
        $todayCommission = (clone $earningsQuery)
            ->whereDate('created_at', today())
            ->sum('amount');

        // Commission kemarin
        $yesterdayCommission = (clone $earningsQuery)
            ->whereDate('created_at', now()->subDay())
            ->sum('amount');

        // Hitung persentase perubahan harian
        $dailyCommissionChange = 0;
        if ($yesterdayCommission > 0) {
            $dailyCommissionChange = (($todayCommission - $yesterdayCommission) / $yesterdayCommission) * 100;
        } elseif ($todayCommission > 0) {
            $dailyCommissionChange = 100;
        }

        // Hitung persentase perubahan bulanan
        $monthlyCommissionChange = 0;
        if ($lastMonthCommission > 0) {
            $monthlyCommissionChange = (($monthlyCommission - $lastMonthCommission) / $lastMonthCommission) * 100;
        } elseif ($monthlyCommission > 0) {
            $monthlyCommissionChange = 100;
        }

        return [
            'total_commission' => $totalCommission,
            'commission_this_month' => $monthlyCommission,
            'commission_today' => $todayCommission,
            'commission_yesterday' => $yesterdayCommission,
            'commission_last_month' => $lastMonthCommission,
            'daily_commission_change' => round($dailyCommissionChange, 1),
            'monthly_commission_change' => round($monthlyCommissionChange, 1),
            'total_referrals' => AffiliateEarning::where('affiliate_user_id', $user->id)
                ->distinct('invoice_id')
                ->count(),
            'conversion_rate' => 0, // Data klik belum ada, jadi kita set 0
            'total_clicks' => 0, // Data klik belum ada, jadi kita set 0
            'recent_referrals' => AffiliateEarning::where('affiliate_user_id', $user->id)
                ->with([
                    'invoice.user',
                    'invoice.courseItems.course',
                    'invoice.bootcampItems.bootcamp',
                    'invoice.webinarItems.webinar',
                    'invoice.bundleEnrollments.bundle',
                    'invoice.certificationProgramItems.certificationProgram',
                    'invoice.parentInvoice.courseItems.course',
                    'invoice.parentInvoice.bootcampItems.bootcamp',
                    'invoice.parentInvoice.webinarItems.webinar',
                    'invoice.parentInvoice.bundleEnrollments.bundle',
                    'invoice.parentInvoice.certificationProgramItems.certificationProgram',
                ])
                ->latest()->take(3)->get(),
            'filtered_date_range' => $startDate && $endDate ? [
                'start' => Carbon::parse($startDate)->format('d M Y'),
                'end' => Carbon::parse($endDate)->format('d M Y')
            ] : null,
        ];
    }

    private function getMentorStats(User $user, $startDate = null, $endDate = null)
    {
        $currentMonthStart = now()->copy()->startOfMonth();
        $currentMonthEnd = $currentMonthStart->copy()->endOfMonth();
        $previousMonthStart = $currentMonthStart->copy()->subMonthNoOverflow()->startOfMonth();
        $previousMonthEnd = $currentMonthStart->copy()->subMonthNoOverflow()->endOfMonth();

        $mentorCourses = Course::where('user_id', $user->id)->pluck('id');

        $studentIds = Invoice::whereHas('courseItems', function ($query) use ($mentorCourses) {
            $query->whereIn('course_id', $mentorCourses);
        })->where('status', 'paid')->distinct()->pluck('user_id');

        $averageRating = CourseRating::whereIn('course_id', $mentorCourses)
            ->avg('rating');

        $mentorCommissionRate = $user->commission / 100;

        $revenueQuery = Invoice::whereHas('courseItems', fn($q) => $q->whereIn('course_id', $mentorCourses))
            ->where('status', 'paid');

        $totalRevenueQuery = clone $revenueQuery;
        if ($startDate && $endDate) {
            $totalRevenueQuery->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }
        $totalCourseRevenue = $totalRevenueQuery->sum('nett_amount');
        $mentorRevenue = $totalCourseRevenue * $mentorCommissionRate;

        $monthlyRevenue = (clone $revenueQuery)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->sum('nett_amount') * $mentorCommissionRate;

        $lastMonthRevenue = (clone $revenueQuery)
            ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
            ->sum('nett_amount') * $mentorCommissionRate;

        $todayRevenue = (clone $revenueQuery)
            ->whereDate('created_at', today())
            ->sum('nett_amount') * $mentorCommissionRate;

        $yesterdayRevenue = (clone $revenueQuery)
            ->whereDate('created_at', now()->subDay())
            ->sum('nett_amount') * $mentorCommissionRate;

        $dailyRevenueChange = 0;
        if ($yesterdayRevenue > 0) {
            $dailyRevenueChange = (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100;
        } elseif ($todayRevenue > 0) {
            $dailyRevenueChange = 100;
        }

        $monthlyRevenueChange = 0;
        if ($lastMonthRevenue > 0) {
            $monthlyRevenueChange = (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
        } elseif ($monthlyRevenue > 0) {
            $monthlyRevenueChange = 100;
        }

        return [
            'total_revenue' => $mentorRevenue,
            'revenue_this_month' => $monthlyRevenue,
            'revenue_today' => $todayRevenue,
            'revenue_yesterday' => $yesterdayRevenue,
            'revenue_last_month' => $lastMonthRevenue,
            'daily_revenue_change' => round($dailyRevenueChange, 1),
            'monthly_revenue_change' => round($monthlyRevenueChange, 1),
            'total_students' => $studentIds->count(),
            'active_courses' => $mentorCourses->count(),
            'average_rating' => $averageRating ? round($averageRating, 1) : 0,
            'total_ratings' => CourseRating::whereIn('course_id', $mentorCourses)->count(),
            'recent_enrollments' => EnrollmentCourse::whereIn('course_id', $mentorCourses)
                ->whereHas('invoice', function ($query) {
                    $query->where('status', 'paid');
                })
                ->with(['invoice.user:id,name', 'course:id,title'])
                ->latest()
                ->take(3)
                ->get()
                ->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->id,
                        'user' => [
                            'name' => $enrollment->invoice->user->name ?? 'Unknown User'
                        ],
                        'course' => [
                            'title' => $enrollment->course->title ?? 'Unknown Course'
                        ],
                        'created_at' => $enrollment->created_at
                    ];
                }),
            'filtered_date_range' => $startDate && $endDate ? [
                'start' => Carbon::parse($startDate)->format('d M Y'),
                'end' => Carbon::parse($endDate)->format('d M Y')
            ] : null,
        ];
    }

    private function getStaffStats(User $user, $startDate = null, $endDate = null)
    {
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $totalCourses = Course::count();
        $totalBootcamps = Bootcamp::count();
        $totalWebinars = Webinar::count();
        $totalArticles = class_exists(Article::class) ? Article::count() : 0;
        $totalCertificationPrograms = class_exists(CertificationProgram::class) ? CertificationProgram::count() : 0;
        $totalUsers = User::role('user')->count();
        $newUsersLastWeek = User::role('user')->where('created_at', '>=', now()->subWeek())->count();

        $courseEnrollmentsCount = EnrollmentCourse::whereHas('invoice', fn($q) => $q->where('status', 'paid'))->count();
        $bootcampEnrollmentsCount = EnrollmentBootcamp::whereHas('invoice', fn($q) => $q->where('status', 'paid'))->count();
        $webinarEnrollmentsCount = EnrollmentWebinar::whereHas('invoice', fn($q) => $q->where('status', 'paid'))->count();
        $totalParticipants = $courseEnrollmentsCount + $bootcampEnrollmentsCount + $webinarEnrollmentsCount;

        // Group modules for quick navigation
        $allModules = StaffPermissionSeeder::getPermissionModules();
        $accessibleModules = [];
        foreach ($allModules as $group) {
            foreach ($group['modules'] as $mod) {
                $canView = in_array("{$mod['key']}.view", $permissions);
                $canManage = in_array("{$mod['key']}.manage", $permissions);
                if ($canView || $canManage) {
                    $accessibleModules[] = [
                        'key' => $mod['key'],
                        'label' => $mod['label'],
                        'group' => $group['group'],
                        'can_view' => $canView,
                        'can_manage' => $canManage,
                    ];
                }
            }
        }

        // Popular products (safe non-financial data, price excluded)
        $popularProducts = collect($this->getPopularProducts())->map(function ($item) {
            return [
                'id' => $item['id'],
                'title' => $item['title'],
                'type' => $item['type'],
                'enrollment_count' => $item['enrollment_count'],
                'thumbnail' => $item['thumbnail'] ?? null,
            ];
        })->take(5)->values()->toArray();

        return [
            'total_users' => $totalUsers,
            'new_users_last_week' => $newUsersLastWeek,
            'total_courses' => $totalCourses,
            'total_bootcamps' => $totalBootcamps,
            'total_webinars' => $totalWebinars,
            'total_articles' => $totalArticles,
            'total_certification_programs' => $totalCertificationPrograms,
            'total_participants' => $totalParticipants,
            'permissions_count' => count($permissions),
            'active_permissions' => $permissions,
            'accessible_modules' => $accessibleModules,
            'popular_products' => $popularProducts,
            'participant_data' => $this->getParticipantData(),
        ];
    }
}
