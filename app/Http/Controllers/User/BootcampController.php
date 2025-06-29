<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Category;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BootcampController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $bootcamps = Bootcamp::with(['category'])
            ->where('status', 'published')
            ->where('registration_deadline', '>=', now())
            ->orderBy('start_date', 'asc')
            ->get();

        $myBootcampIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myBootcampIds = Invoice::with('bootcampItems.bootcamp.category')
                ->where('user_id', $userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->bootcampItems->pluck('bootcamp_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/bootcamp/dashboard/index', ['categories' => $categories, 'bootcamps' => $bootcamps, 'myBootcampIds' => $myBootcampIds]);
    }

    public function detail(Bootcamp $bootcamp)
    {
        $bootcamp->load(['category', 'schedules', 'tools']);
        return Inertia::render('user/bootcamp/detail/index', ['bootcamp' => $bootcamp]);
    }

    public function showRegister(Bootcamp $bootcamp)
    {
        $bootcamp->load(['schedules']);
        $hasAccess = false;
        if (Auth::check()) {
            $userId = Auth::id();
            $hasAccess = Invoice::where('user_id', $userId)
                ->whereIn('status', ['paid', 'completed'])
                ->whereHas('bootcampItems', function ($query) use ($bootcamp) {
                    $query->where('bootcamp_id', $bootcamp->id);
                })
                ->exists();
            if (!$hasAccess) {
                $pendingInvoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('bootcampItems', function ($query) use ($bootcamp) {
                        $query->where('bootcamp_id', $bootcamp->id);
                    })
                    ->latest()
                    ->first();

                if ($pendingInvoice && $pendingInvoice->invoice_url) {
                    $pendingInvoiceUrl = $pendingInvoice->invoice_url;
                }
            }
        }
        return Inertia::render('user/bootcamp/register/index', ['bootcamp' => $bootcamp, 'hasAccess' => $hasAccess, 'pendingInvoiceUrl' => $pendingInvoiceUrl ?? null]);
    }

    public function showRegisterSuccess()
    {
        return Inertia::render('user/checkout/success');
    }
}
