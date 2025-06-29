<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WebinarController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $webinars = Webinar::with(['category'])
            ->where('status', 'published')
            ->where('registration_deadline', '>=', now())
            ->orderBy('start_time', 'asc')
            ->get();

        $myWebinarIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myWebinarIds = Invoice::with('webinarItems.webinar.category')
                ->where('user_id', $userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->webinarItems->pluck('webinar_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/webinar/dashboard/index', ['categories' => $categories, 'webinars' => $webinars, 'myWebinarIds' => $myWebinarIds]);
    }

    public function detail(Webinar $webinar)
    {
        $webinar->load(['category', 'tools']);
        return Inertia::render('user/webinar/detail/index', ['webinar' => $webinar]);
    }


    public function showRegister(Webinar $webinar)
    {
        $webinar->load(['tools']);
        $hasAccess = false;
        if (Auth::check()) {
            $userId = Auth::id();
            $hasAccess = Invoice::where('user_id', $userId)
                ->whereIn('status', ['paid', 'completed'])
                ->whereHas('webinarItems', function ($query) use ($webinar) {
                    $query->where('webinar_id', $webinar->id);
                })
                ->exists();
            if (!$hasAccess) {
                $pendingInvoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('webinarItems', function ($query) use ($webinar) {
                        $query->where('webinar_id', $webinar->id);
                    })
                    ->latest()
                    ->first();

                if ($pendingInvoice && $pendingInvoice->invoice_url) {
                    $pendingInvoiceUrl = $pendingInvoice->invoice_url;
                }
            }
        }
        return Inertia::render('user/webinar/register/index', ['webinar' => $webinar, 'hasAccess' => $hasAccess, 'pendingInvoiceUrl' => $pendingInvoiceUrl ?? null]);
    }

    public function showRegisterSuccess()
    {
        return Inertia::render('user/checkout/success');
    }
}
