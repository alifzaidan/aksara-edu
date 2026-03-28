<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;

class InvoiceApiController extends Controller
{
    /**
     * Get all invoices with optional filters
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:paid,pending,failed',
        ]);

        $query = Invoice::whereHas('user', function ($q) {
            $q->role('user');
        })
            ->where('amount', '>', 0)
            ->with([
                'user:id,name,email,phone_number,avatar',
                'courseItems.course:id,title,slug,price,thumbnail',
                'bootcampItems.bootcamp:id,title,slug,price,thumbnail',
                'webinarItems.webinar:id,title,slug,price,thumbnail',
                'bundleEnrollments.bundle:id,title,slug,price,thumbnail'
            ]);

        // By default return all statuses, but allow explicit status filter.
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Filter by invoice code
        if ($request->has('invoice_code') && $request->invoice_code) {
            $query->where('invoice_code', 'like', '%' . $request->invoice_code . '%');
        }

        // Filter by user_id
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by buyer name
        if ($request->has('buyer_name') && $request->buyer_name) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->buyer_name . '%');
            });
        }

        // Filter by buyer email
        if ($request->has('buyer_email') && $request->buyer_email) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('email', 'like', '%' . $request->buyer_email . '%');
            });
        }

        // Filter by payment method
        if ($request->has('payment_method') && $request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Filter by paid date range
        if ($request->has('paid_start_date') && $request->paid_start_date) {
            $query->whereDate('paid_at', '>=', $request->paid_start_date);
        }

        if ($request->has('paid_end_date') && $request->paid_end_date) {
            $query->whereDate('paid_at', '<=', $request->paid_end_date);
        }

        // Filter by amount range
        if ($request->has('min_amount') && $request->min_amount) {
            $query->where('nett_amount', '>=', $request->min_amount);
        }

        if ($request->has('max_amount') && $request->max_amount) {
            $query->where('nett_amount', '<=', $request->max_amount);
        }

        // Search across multiple fields
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', '%' . $search . '%')
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%');
                    });
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);

        if ($request->get('all') === 'true') {
            $invoices = $query->get();
        } else {
            $invoices = $query->paginate($perPage);
        }

        // Transform data to include product type and details
        $transformedData = $this->transformInvoices($invoices);

        return response()->json([
            'success' => true,
            'data' => $transformedData,
        ]);
    }

    /**
     * Get a specific invoice by ID
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $invoice = Invoice::whereHas('user', function ($q) {
            $q->role('user');
        })
            ->where('amount', '>', 0)
            ->with([
                'user:id,name,email,phone_number,avatar',
                'courseItems.course:id,title,slug,price,thumbnail',
                'bootcampItems.bootcamp:id,title,slug,price,thumbnail',
                'webinarItems.webinar:id,title,slug,price,thumbnail',
                'bundleEnrollments.bundle:id,title,slug,price,thumbnail'
            ])->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        }

        $transformed = $this->transformSingleInvoice($invoice);

        return response()->json([
            'success' => true,
            'data' => $transformed,
        ]);
    }

    /**
     * Get invoice statistics summary
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $validated = request()->validate([
            'status' => 'nullable|in:paid,pending,failed',
        ]);

        $invoices = Invoice::whereHas('user', function ($q) {
            $q->role('user');
        })
            ->where('amount', '>', 0)
            ->when(!empty($validated['status']), function ($query) use ($validated) {
                $query->where('status', $validated['status']);
            })
            ->get();

        $totalTransactions = $invoices->count();
        $paidTransactions = $invoices->where('status', 'paid')->count();
        $pendingTransactions = $invoices->where('status', 'pending')->count();
        $failedTransactions = $invoices->where('status', 'failed')->count();

        $paidInvoices = $invoices->where('status', 'paid');

        // Revenue statistics
        $totalRevenue = $paidInvoices->sum('nett_amount');

        // Revenue bulan ini dihitung berdasarkan paid_at
        $thisMonthRevenue = $paidInvoices
            ->filter(function ($invoice) {
                return $invoice->paid_at && Carbon::parse($invoice->paid_at)->isCurrentMonth();
            })
            ->sum('nett_amount');

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $lastMonthStart = Carbon::now()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = Carbon::now()->subMonthNoOverflow()->endOfMonth();

        $totalNominalToday = $paidInvoices
            ->filter(function ($invoice) use ($today) {
                return $invoice->paid_at && Carbon::parse($invoice->paid_at)->isSameDay($today);
            })
            ->sum('nett_amount');

        $totalNominalYesterday = $paidInvoices
            ->filter(function ($invoice) use ($yesterday) {
                return $invoice->paid_at && Carbon::parse($invoice->paid_at)->isSameDay($yesterday);
            })
            ->sum('nett_amount');

        $totalNominalLastMonth = $paidInvoices
            ->filter(function ($invoice) use ($lastMonthStart, $lastMonthEnd) {
                if (!$invoice->paid_at) {
                    return false;
                }

                $paidAt = Carbon::parse($invoice->paid_at);

                return $paidAt->greaterThanOrEqualTo($lastMonthStart)
                    && $paidAt->lessThanOrEqualTo($lastMonthEnd);
            })
            ->sum('nett_amount');

        // Success rate
        $successRate = $totalTransactions > 0
            ? ($paidTransactions / $totalTransactions) * 100
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'total_transactions' => $totalTransactions,
                'total_nominal_today' => $totalNominalToday,
                'total_nominal_yesterday' => $totalNominalYesterday,
                'total_nominal_last_month' => $totalNominalLastMonth,
                'paid_transactions' => $paidTransactions,
                'pending_transactions' => $pendingTransactions,
                'failed_transactions' => $failedTransactions,
                'total_revenue' => $totalRevenue,
                'this_month_revenue' => $thisMonthRevenue,
                'success_rate' => round($successRate, 2),
            ],
        ]);
    }

    /**
     * Transform invoices collection to include product info
     *
     * @param mixed $invoices
     * @return array
     */
    private function transformInvoices($invoices): array
    {
        $items = $invoices instanceof \Illuminate\Pagination\LengthAwarePaginator
            ? $invoices->items()
            : $invoices->all();

        $transformed = collect($items)->map(function ($invoice) {
            return $this->transformSingleInvoice($invoice);
        })->all();

        if ($invoices instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            return [
                'items' => $transformed,
                'pagination' => [
                    'current_page' => $invoices->currentPage(),
                    'last_page' => $invoices->lastPage(),
                    'per_page' => $invoices->perPage(),
                    'total' => $invoices->total(),
                    'from' => $invoices->firstItem(),
                    'to' => $invoices->lastItem(),
                ],
            ];
        }

        return [
            'items' => $transformed,
        ];
    }

    /**
     * Transform a single invoice to include product info
     *
     * @param Invoice $invoice
     * @return array
     */
    private function transformSingleInvoice(Invoice $invoice): array
    {
        $products = [];
        $productType = null;

        // Check for bundle enrollments first
        if ($invoice->bundleEnrollments->count() > 0) {
            $productType = 'bundle';
            foreach ($invoice->bundleEnrollments as $enrollment) {
                $products[] = [
                    'type' => 'bundle',
                    'type_label' => 'Bundle',
                    'id' => $enrollment->bundle->id ?? null,
                    'title' => $enrollment->bundle->title ?? null,
                    'slug' => $enrollment->bundle->slug ?? null,
                    'price' => $enrollment->bundle->price ?? null,
                    'thumbnail' => $enrollment->bundle->thumbnail ?? null,
                ];
            }
        }

        // Check for course items
        if ($invoice->courseItems->count() > 0) {
            $productType = $productType ?? 'course';
            foreach ($invoice->courseItems as $item) {
                $products[] = [
                    'type' => 'course',
                    'type_label' => 'Kelas Online',
                    'id' => $item->course->id ?? null,
                    'title' => $item->course->title ?? null,
                    'slug' => $item->course->slug ?? null,
                    'price' => $item->course->price ?? null,
                    'thumbnail' => $item->course->thumbnail ?? null,
                ];
            }
        }

        // Check for bootcamp items
        if ($invoice->bootcampItems->count() > 0) {
            $productType = $productType ?? 'bootcamp';
            foreach ($invoice->bootcampItems as $item) {
                $products[] = [
                    'type' => 'bootcamp',
                    'type_label' => 'Bootcamp',
                    'id' => $item->bootcamp->id ?? null,
                    'title' => $item->bootcamp->title ?? null,
                    'slug' => $item->bootcamp->slug ?? null,
                    'price' => $item->bootcamp->price ?? null,
                    'thumbnail' => $item->bootcamp->thumbnail ?? null,
                ];
            }
        }

        // Check for webinar items
        if ($invoice->webinarItems->count() > 0) {
            $productType = $productType ?? 'webinar';
            foreach ($invoice->webinarItems as $item) {
                $products[] = [
                    'type' => 'webinar',
                    'type_label' => 'Webinar',
                    'id' => $item->webinar->id ?? null,
                    'title' => $item->webinar->title ?? null,
                    'slug' => $item->webinar->slug ?? null,
                    'price' => $item->webinar->price ?? null,
                    'thumbnail' => $item->webinar->thumbnail ?? null,
                ];
            }
        }

        return [
            'id' => $invoice->id,
            'invoice_code' => $invoice->invoice_code,
            'status' => $invoice->status,
            'amount' => $invoice->amount,
            'discount_amount' => $invoice->discount_amount,
            'nett_amount' => $invoice->nett_amount,
            'payment_method' => $invoice->payment_method,
            'payment_channel' => $invoice->payment_channel,
            'invoice_url' => $invoice->invoice_url,
            'paid_at' => $invoice->paid_at,
            'expires_at' => $invoice->expires_at,
            'created_at' => $invoice->created_at,
            'updated_at' => $invoice->updated_at,
            'buyer' => $invoice->user ? [
                'id' => $invoice->user->id,
                'name' => $invoice->user->name,
                'email' => $invoice->user->email,
                'phone_number' => $invoice->user->phone_number,
                'avatar' => $invoice->user->avatar,
            ] : null,
            'product_type' => $productType,
            'product_type_label' => $this->getProductTypeLabel($productType),
            'products' => $products,
        ];
    }

    /**
     * Get product type label in Indonesian
     *
     * @param string|null $type
     * @return string
     */
    private function getProductTypeLabel(?string $type): string
    {
        return match ($type) {
            'course' => 'Kelas Online',
            'bootcamp' => 'Bootcamp',
            'webinar' => 'Webinar',
            'bundle' => 'Bundle',
            default => 'Unknown',
        };
    }
}
