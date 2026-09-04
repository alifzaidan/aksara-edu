<?php

use App\Http\Controllers\Api\InvoiceApiController;
use App\Http\Controllers\Api\UserApiController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\SearchController;
// use App\Http\Controllers\CRM\WablasWebhookController;
// use App\Http\Controllers\CRM\EvolutionWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Route::post('/discount-codes/validate', [DiscountCodeController::class, 'validate'])->name('discount-codes.validate');

Route::post('/xendit/callback', [InvoiceController::class, 'callbackXendit'])->name('xendit.callback');

Route::get('/search', [SearchController::class, 'search']);

// Public API Routes
Route::middleware(['auth:sanctum', 'token.ability:external-api'])->group(function () {
    Route::get('/users', [UserApiController::class, 'index'])->name('api.users.index');
    Route::get('/users/{id}', [UserApiController::class, 'show'])->name('api.users.show');

    Route::get('/invoices', [InvoiceApiController::class, 'index'])->name('api.invoices.index');
    Route::get('/invoices/statistics', [InvoiceApiController::class, 'statistics'])->name('api.invoices.statistics');
    Route::get('/invoices/{id}', [InvoiceApiController::class, 'show'])->name('api.invoices.show');
});

Route::post('/check-email', function (Request $request) {
    $user = \App\Models\User::where('email', $request->email)->first();

    $response = [
        'exists' => !!$user,
        'active_installment' => null,
    ];

    if ($user) {
        $response['name'] = $user->name;
        $response['phone_number'] = $user->phone_number;
        $response['instance'] = $user->instance;
        $response['city'] = $user->city;
        $response['point_balance'] = (int) $user->point_balance;

        $type = $request->input('type');
        $productId = $request->input('id')
            ?? $request->input('program_id')
            ?? $request->input('bootcamp_id')
            ?? $request->input('bundle_id')
            ?? $request->input('webinar_id')
            ?? $request->input('course_id')
            ?? $request->input('private_class_id');

        if ($type && $productId) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, $type, $productId);
        } elseif ($request->program_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'certification_program', $request->program_id);
        } elseif ($request->bootcamp_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'bootcamp', $request->bootcamp_id);
        } elseif ($request->bundle_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'bundle', $request->bundle_id);
        } elseif ($request->webinar_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'webinar', $request->webinar_id);
        } elseif ($request->course_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'course', $request->course_id);
        } elseif ($request->private_class_id) {
            $response['active_installment'] = \App\Models\Invoice::getActiveInstallmentForUser($user->id, 'private', $request->private_class_id);
        }
    }

    // Check scholarship application status from email (works for both registered and unregistered users)
    if ($request->program_id) {
        $program = \App\Models\CertificationProgram::find($request->program_id);
        if ($program && $program->type === 'scholarship') {
            $scholarshipApp = \App\Models\CertificationProgramScholarshipApplication::where('certification_program_id', $program->id)
                ->where('email', $request->email)
                ->latest()
                ->first();

            if ($scholarshipApp) {
                $response['scholarship_application_status'] = $scholarshipApp->status;
            }
        }
    }

    return response()->json($response);
});

// Route::post('/webhook/wablas', [WablasWebhookController::class, 'handle']);
// Route::post('/webhook/evolution', [EvolutionWebhookController::class, 'handle']);