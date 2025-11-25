<?php

namespace App\Http\Controllers;

use App\Models\DiscountCode;
use App\Models\Course;
use App\Models\Bootcamp;
use App\Models\DiscountUsage;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DiscountCodeController extends Controller
{
    public function index()
    {
        $discountCodes = DiscountCode::withCount('usages')
            ->latest()
            ->get()
            ->map(function ($code) {
                return [
                    'id' => $code->id,
                    'code' => $code->code,
                    'name' => $code->name,
                    'description' => $code->description,
                    'type' => $code->type,
                    'value' => $code->value,
                    'formatted_value' => $code->formatted_value,
                    'minimum_amount' => $code->minimum_amount,
                    'usage_limit' => $code->usage_limit,
                    'usage_limit_per_user' => $code->usage_limit_per_user,
                    'used_count' => $code->used_count,
                    'usages_count' => $code->usages_count,
                    'starts_at' => $code->starts_at,
                    'expires_at' => $code->expires_at,
                    'is_active' => $code->is_active,
                    'is_valid' => $code->isValid(),
                    'applicable_types' => $code->applicable_types,
                    'applicable_ids' => $code->applicable_ids,
                    'created_at' => $code->created_at,
                ];
            });

        $totalCodes = $discountCodes->count();

        $activeCodes = $discountCodes->where('is_active', true)->where('is_valid', true)->count();
        $inactiveCodes = $discountCodes->where('is_active', false)->count();
        $expiredCodes = $discountCodes->where('is_valid', false)->where('is_active', true)->count();

        $now = Carbon::now();
        $upcomingCodes = $discountCodes->filter(function ($code) use ($now) {
            $startsAt = Carbon::parse($code['starts_at']);
            return $code['is_active'] && $startsAt->isAfter($now);
        })->count();

        $percentageCodes = $discountCodes->where('type', 'percentage')->count();
        $fixedCodes = $discountCodes->where('type', 'fixed')->count();

        $totalUsages = $discountCodes->sum('used_count');
        $averageUsagePerCode = $totalCodes > 0 ? round($totalUsages / $totalCodes, 1) : 0;

        $discountCodeIds = $discountCodes->pluck('id');
        $totalDiscountGiven = DiscountUsage::whereIn('discount_code_id', $discountCodeIds)
            ->whereHas('invoice', function ($query) {
                $query->where('status', 'paid');
            })
            ->sum('discount_amount');

        $usedCodes = $discountCodes->where('used_count', '>', 0)->count();
        $unusedCodes = $totalCodes - $usedCodes;

        $usagesToday = DiscountUsage::whereIn('discount_code_id', $discountCodeIds)
            ->whereDate('created_at', today())
            ->count();

        $usagesThisMonth = DiscountUsage::whereIn('discount_code_id', $discountCodeIds)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $topCodes = $discountCodes->sortByDesc('used_count')->take(3)->map(function ($code) {
            return [
                'id' => $code['id'],
                'code' => $code['code'],
                'name' => $code['name'],
                'used_count' => $code['used_count'],
            ];
        })->values();

        $codesNearingLimit = $discountCodes->filter(function ($code) {
            if (!$code['usage_limit']) return false;
            $usagePercentage = ($code['used_count'] / $code['usage_limit']) * 100;
            return $usagePercentage >= 80 && $usagePercentage < 100;
        })->count();

        $statistics = [
            'overview' => [
                'total_codes' => $totalCodes,
                'active_codes' => $activeCodes,
                'inactive_codes' => $inactiveCodes,
                'expired_codes' => $expiredCodes,
                'upcoming_codes' => $upcomingCodes,
            ],
            'type' => [
                'percentage_codes' => $percentageCodes,
                'fixed_codes' => $fixedCodes,
            ],
            'usage' => [
                'total_usages' => $totalUsages,
                'average_usage' => $averageUsagePerCode,
                'used_codes' => $usedCodes,
                'unused_codes' => $unusedCodes,
                'usages_today' => $usagesToday,
                'usages_this_month' => $usagesThisMonth,
                'codes_nearing_limit' => $codesNearingLimit,
            ],
            'performance' => [
                'total_discount_given' => $totalDiscountGiven,
                'top_codes' => $topCodes,
            ],
        ];

        return Inertia::render('admin/discount-codes/index', [
            'discountCodes' => $discountCodes,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $courses = Course::select('id', 'title', 'price')->where('status', 'published')->get();

        $bootcamps = Bootcamp::select('id', 'title', 'price', 'registration_deadline', 'start_date', 'batch')
            ->where('status', 'published')
            ->get()
            ->map(function ($bootcamp) {
                return [
                    'id' => $bootcamp->id,
                    'title' => $bootcamp->title . ' (Batch ' . $bootcamp->batch . ')',
                    'original_title' => $bootcamp->title,
                    'price' => $bootcamp->price,
                    'registration_deadline' => $bootcamp->registration_deadline,
                    'start_date' => $bootcamp->start_date,
                    'batch' => $bootcamp->batch,
                ];
            });

        $webinars = Webinar::select('id', 'title', 'price', 'registration_deadline', 'start_time', 'batch')
            ->where('status', 'published')
            ->get()
            ->map(function ($webinar) {
                return [
                    'id' => $webinar->id,
                    'title' => $webinar->title . ' (Batch ' . $webinar->batch . ')',
                    'original_title' => $webinar->title,
                    'price' => $webinar->price,
                    'registration_deadline' => $webinar->registration_deadline,
                    'event_date' => $webinar->start_time,
                    'batch' => $webinar->batch,
                ];
            });

        return Inertia::render('admin/discount-codes/create', [
            'products' => [
                'courses' => $courses,
                'bootcamps' => $bootcamps,
                'webinars' => $webinars,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:discount_codes,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|integer|min:1',
            'minimum_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'required|date',
            'expires_at' => 'required|date|after:starts_at',
            'is_active' => 'boolean',
            'applicable_types' => 'nullable|array',
            'applicable_types.*' => 'in:course,bootcamp,webinar',
            'applicable_ids' => 'nullable|array',
            'applicable_products' => 'nullable|array',
            'applicable_products.*.type' => 'in:course,bootcamp,webinar',
            'applicable_products.*.id' => 'string',
        ]);

        if ($request->type === 'percentage' && $request->value > 100) {
            return back()->withErrors(['value' => 'Persentase tidak boleh lebih dari 100%']);
        }

        $data = $request->except(['applicable_products']);

        foreach (['starts_at', 'expires_at'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = \Carbon\Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $startsAt = new \DateTime($data['starts_at']);

            foreach ($request->applicable_products as $product) {
                if ($product['type'] === 'bootcamp') {
                    $bootcamp = Bootcamp::find($product['id']);
                    if ($bootcamp && $bootcamp->registration_deadline) {
                        $registrationEnd = new \DateTime($bootcamp->registration_deadline);
                        if ($registrationEnd < $startsAt) {
                            return back()->withErrors([
                                'applicable_products' => "Bootcamp '{$bootcamp->title} (Batch {$bootcamp->batch})' sudah tutup pendaftaran sebelum tanggal mulai diskon."
                            ]);
                        }
                    }
                } elseif ($product['type'] === 'webinar') {
                    $webinar = Webinar::find($product['id']);
                    if ($webinar && $webinar->registration_deadline) {
                        $registrationEnd = new \DateTime($webinar->registration_deadline);
                        if ($registrationEnd < $startsAt) {
                            return back()->withErrors([
                                'applicable_products' => "Webinar '{$webinar->title} (Batch {$webinar->batch})' sudah tutup pendaftaran sebelum tanggal mulai diskon."
                            ]);
                        }
                    }
                }
            }
        }

        $applicableIds = null;
        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $applicableIds = collect($request->applicable_products)->map(function ($product) {
                return $product['type'] . ':' . $product['id'];
            })->toArray();
        }

        $data['applicable_ids'] = $applicableIds;

        DiscountCode::create($data);

        return redirect()->route('discount-codes.index')
            ->with('success', 'Kode diskon berhasil ditambahkan');
    }

    public function show(DiscountCode $discountCode)
    {
        $discountCode->load(['usages.user', 'usages.invoice']);

        $applicableProducts = [];
        if ($discountCode->applicable_ids) {
            $courses = Course::select('id', 'title', 'price')->get();
            $bootcamps = Bootcamp::select('id', 'title', 'price', 'registration_deadline', 'start_date', 'batch')->get();
            $webinars = Webinar::select('id', 'title', 'price', 'registration_deadline', 'start_time', 'batch')->get();

            foreach ($discountCode->applicable_ids as $applicableId) {
                [$type, $id] = explode(':', $applicableId);
                $product = null;

                switch ($type) {
                    case 'course':
                        $product = $courses->firstWhere('id', $id);
                        if ($product) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $product->title,
                                'price' => $product->price,
                                'registration_deadline' => null,
                                'start_date' => null,
                                'event_date' => null,
                                'batch' => null,
                            ];
                        }
                        break;
                    case 'bootcamp':
                        $product = $bootcamps->firstWhere('id', $id);
                        if ($product) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $product->title . ' (Batch ' . $product->batch . ')',
                                'price' => $product->price,
                                'registration_deadline' => $product->registration_deadline,
                                'start_date' => $product->start_date,
                                'event_date' => null,
                                'batch' => $product->batch,
                            ];
                        }
                        break;
                    case 'webinar':
                        $product = $webinars->firstWhere('id', $id);
                        if ($product) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $product->title . ' (Batch ' . $product->batch . ')',
                                'price' => $product->price,
                                'registration_deadline' => $product->registration_deadline,
                                'start_date' => null,
                                'event_date' => $product->start_time,
                                'batch' => $product->batch,
                            ];
                        }
                        break;
                }
            }
        }

        $discountCodeData = $discountCode->toArray();
        $discountCodeData['applicable_products'] = $applicableProducts;

        return Inertia::render('admin/discount-codes/show', [
            'discountCode' => $discountCodeData
        ]);
    }

    public function edit(DiscountCode $discountCode)
    {
        $courses = Course::select('id', 'title', 'price')->where('status', 'published')->get();

        $bootcamps = Bootcamp::select('id', 'title', 'price', 'registration_deadline', 'start_date', 'batch')
            ->where('status', 'published')
            ->get()
            ->map(function ($bootcamp) {
                return [
                    'id' => $bootcamp->id,
                    'title' => $bootcamp->title . ' (Batch ' . $bootcamp->batch . ')',
                    'original_title' => $bootcamp->title,
                    'price' => $bootcamp->price,
                    'registration_deadline' => $bootcamp->registration_deadline,
                    'start_date' => $bootcamp->start_date,
                    'batch' => $bootcamp->batch,
                ];
            });

        $webinars = Webinar::select('id', 'title', 'price', 'registration_deadline', 'start_time', 'batch')
            ->where('status', 'published')
            ->get()
            ->map(function ($webinar) {
                return [
                    'id' => $webinar->id,
                    'title' => $webinar->title . ' (Batch ' . $webinar->batch . ')',
                    'original_title' => $webinar->title,
                    'price' => $webinar->price,
                    'registration_deadline' => $webinar->registration_deadline,
                    'event_date' => $webinar->start_time,
                    'batch' => $webinar->batch,
                ];
            });

        $applicableProducts = [];
        if ($discountCode->applicable_ids) {
            foreach ($discountCode->applicable_ids as $applicableId) {
                [$type, $id] = explode(':', $applicableId);
                $product = null;

                switch ($type) {
                    case 'course':
                        $product = $courses->firstWhere('id', $id);
                        if ($product) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $product->title,
                                'price' => $product->price,
                                'registration_deadline' => null,
                                'start_date' => null,
                                'event_date' => null,
                                'batch' => null,
                            ];
                        }
                        break;
                    case 'bootcamp':
                        $product = $bootcamps->firstWhere('id', $id);
                        if ($product) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $product['title'],
                                'price' => $product['price'],
                                'registration_deadline' => $product['registration_deadline'],
                                'start_date' => $product['start_date'],
                                'event_date' => null,
                                'batch' => $product['batch'],
                            ];
                        }
                        break;
                    case 'webinar':
                        $webinarProduct = $webinars->firstWhere('id', $id);
                        if ($webinarProduct) {
                            $applicableProducts[] = [
                                'type' => $type,
                                'id' => $id,
                                'title' => $webinarProduct['title'],
                                'price' => $webinarProduct['price'],
                                'registration_deadline' => $webinarProduct['registration_deadline'],
                                'start_date' => null,
                                'event_date' => $webinarProduct['event_date'],
                                'batch' => $webinarProduct['batch'],
                            ];
                        }
                        break;
                }
            }
        }

        $discountCodeData = $discountCode->toArray();
        $discountCodeData['applicable_products'] = $applicableProducts;

        return Inertia::render('admin/discount-codes/edit', [
            'discountCode' => $discountCodeData,
            'products' => [
                'courses' => $courses,
                'bootcamps' => $bootcamps,
                'webinars' => $webinars,
            ]
        ]);
    }

    public function update(Request $request, DiscountCode $discountCode)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:discount_codes,code,' . $discountCode->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|integer|min:1',
            'minimum_amount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'starts_at' => 'required|date',
            'expires_at' => 'required|date|after:starts_at',
            'is_active' => 'boolean',
            'applicable_types' => 'nullable|array',
            'applicable_types.*' => 'in:course,bootcamp,webinar',
            'applicable_products' => 'nullable|array',
            'applicable_products.*.type' => 'in:course,bootcamp,webinar',
            'applicable_products.*.id' => 'string',
        ]);

        if ($request->type === 'percentage' && $request->value > 100) {
            return back()->withErrors(['value' => 'Persentase tidak boleh lebih dari 100%']);
        }

        $data = $request->except(['applicable_products']);

        foreach (['starts_at', 'expires_at'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = \Carbon\Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $startsAt = new \DateTime($data['starts_at']);

            foreach ($request->applicable_products as $product) {
                if ($product['type'] === 'bootcamp') {
                    $bootcamp = Bootcamp::find($product['id']);
                    if ($bootcamp && $bootcamp->registration_deadline) {
                        $registrationEnd = new \DateTime($bootcamp->registration_deadline);
                        if ($registrationEnd < $startsAt) {
                            return back()->withErrors([
                                'applicable_products' => "Bootcamp '{$bootcamp->title} (Batch {$bootcamp->batch})' sudah tutup pendaftaran sebelum tanggal mulai diskon."
                            ]);
                        }
                    }
                } elseif ($product['type'] === 'webinar') {
                    $webinar = Webinar::find($product['id']);
                    if ($webinar && $webinar->registration_deadline) {
                        $registrationEnd = new \DateTime($webinar->registration_deadline);
                        if ($registrationEnd < $startsAt) {
                            return back()->withErrors([
                                'applicable_products' => "Webinar '{$webinar->title} (Batch {$webinar->batch})' sudah tutup pendaftaran sebelum tanggal mulai diskon."
                            ]);
                        }
                    }
                }
            }
        }

        $applicableIds = null;
        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $applicableIds = collect($request->applicable_products)->map(function ($product) {
                return $product['type'] . ':' . $product['id'];
            })->toArray();
        }

        $data['applicable_ids'] = $applicableIds;

        $discountCode->update($data);

        return redirect()->route('discount-codes.index')
            ->with('success', 'Kode diskon berhasil diperbarui');
    }

    public function destroy(DiscountCode $discountCode)
    {
        $discountCode->delete();

        return redirect()->route('discount-codes.index')
            ->with('success', 'Kode diskon berhasil dihapus');
    }

    public function validate(Request $request)
    {
        try {
            $request->validate([
                'code' => 'required|string',
                'amount' => 'required|integer|min:1',
                'product_type' => 'required|string|in:course,bootcamp,webinar',
                'product_id' => 'required|string',
            ]);

            $discountCode = DiscountCode::where('code', $request->code)->first();

            if (!$discountCode) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Kode diskon tidak ditemukan'
                ]);
            }

            $userId = Auth::id();
            if (!$userId) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Anda harus login terlebih dahulu'
                ]);
            }

            if (!$discountCode->isValid()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Kode diskon tidak valid atau sudah kedaluwarsa'
                ]);
            }

            if (!$discountCode->canBeUsed()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Kode diskon sudah mencapai batas penggunaan'
                ]);
            }

            if (!$discountCode->canBeUsedByUser($userId)) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Anda sudah mencapai batas penggunaan kode diskon ini'
                ]);
            }

            if (!$discountCode->isApplicableToProduct($request->product_type, $request->product_id)) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Kode diskon tidak berlaku untuk produk ini'
                ]);
            }

            $discountAmount = $discountCode->calculateDiscount($request->amount);

            if ($discountAmount === 0) {
                $minAmount = $discountCode->minimum_amount ? 'Rp ' . number_format($discountCode->minimum_amount, 0, ',', '.') : 'tidak ada';
                return response()->json([
                    'valid' => false,
                    'message' => "Minimum pembelian untuk kode diskon ini adalah {$minAmount}"
                ]);
            }

            return response()->json([
                'valid' => true,
                'discount_amount' => $discountAmount,
                'final_amount' => $request->amount - $discountAmount,
                'discount_code' => [
                    'id' => $discountCode->id,
                    'code' => $discountCode->code,
                    'name' => $discountCode->name,
                    'type' => $discountCode->type,
                    'formatted_value' => $discountCode->formatted_value,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Data tidak valid: ' . implode(', ', $e->validator->errors()->all())
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
            ], 500);
        }
    }
}
