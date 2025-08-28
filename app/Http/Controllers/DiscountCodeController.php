<?php

namespace App\Http\Controllers;

use App\Models\DiscountCode;
use App\Models\Course;
use App\Models\Bootcamp;
use App\Models\Webinar;
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

        return Inertia::render('admin/discount-codes/index', [
            'discountCodes' => $discountCodes
        ]);
    }

    public function create()
    {
        $courses = Course::select('id', 'title', 'price')->where('status', 'published')->get();
        $bootcamps = Bootcamp::select('id', 'title', 'price')->where('status', 'published')->get();
        $webinars = Webinar::select('id', 'title', 'price')->where('status', 'published')->get();

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

        $applicableIds = null;
        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $applicableIds = collect($request->applicable_products)->map(function ($product) {
                return $product['type'] . ':' . $product['id'];
            })->toArray();
        }

        $data = $request->except(['applicable_products']);
        $data['applicable_ids'] = $applicableIds;

        DiscountCode::create($data);

        return redirect()->route('discount-codes.index')
            ->with('success', 'Kode diskon berhasil ditambahkan');
    }

    public function show(DiscountCode $discountCode)
    {
        $discountCode->load(['usages.user', 'usages.invoice']);

        // Get specific products if applicable_ids exists
        $applicableProducts = [];
        if ($discountCode->applicable_ids) {
            $courses = Course::select('id', 'title', 'price')->get();
            $bootcamps = Bootcamp::select('id', 'title', 'price')->get();
            $webinars = Webinar::select('id', 'title', 'price')->get();

            foreach ($discountCode->applicable_ids as $applicableId) {
                [$type, $id] = explode(':', $applicableId);
                $product = null;

                switch ($type) {
                    case 'course':
                        $product = $courses->firstWhere('id', $id);
                        break;
                    case 'bootcamp':
                        $product = $bootcamps->firstWhere('id', $id);
                        break;
                    case 'webinar':
                        $product = $webinars->firstWhere('id', $id);
                        break;
                }

                if ($product) {
                    $applicableProducts[] = [
                        'type' => $type,
                        'id' => $id,
                        'title' => $product->title,
                        'price' => $product->price,
                    ];
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
        $bootcamps = Bootcamp::select('id', 'title', 'price')->where('status', 'published')->get();
        $webinars = Webinar::select('id', 'title', 'price')->where('status', 'published')->get();

        $applicableProducts = [];
        if ($discountCode->applicable_ids) {
            foreach ($discountCode->applicable_ids as $applicableId) {
                [$type, $id] = explode(':', $applicableId);
                $product = null;

                switch ($type) {
                    case 'course':
                        $product = $courses->firstWhere('id', $id);
                        break;
                    case 'bootcamp':
                        $product = $bootcamps->firstWhere('id', $id);
                        break;
                    case 'webinar':
                        $product = $webinars->firstWhere('id', $id);
                        break;
                }

                if ($product) {
                    $applicableProducts[] = [
                        'type' => $type,
                        'id' => $id,
                        'title' => $product->title,
                        'price' => $product->price,
                    ];
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

        // Format applicable_ids dari applicable_products
        $applicableIds = null;
        if ($request->applicable_products && count($request->applicable_products) > 0) {
            $applicableIds = collect($request->applicable_products)->map(function ($product) {
                return $product['type'] . ':' . $product['id'];
            })->toArray();
        }

        $data = $request->except(['applicable_products']);
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

    // API untuk validasi kode diskon
    public function validate(Request $request)
    {
        $id = Auth::id();

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

        if (!$discountCode->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Kode diskon tidak valid atau sudah kedaluwarsa'
            ]);
        }

        if (!$discountCode->canBeUsedByUser($id)) {
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
            return response()->json([
                'valid' => false,
                'message' => 'Minimum pembelian untuk kode diskon ini adalah Rp ' . number_format($discountCode->minimum_amount, 0, ',', '.')
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
    }
}
