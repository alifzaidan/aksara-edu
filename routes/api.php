<?php

use App\Http\Controllers\Api\Agent\CatalogSummaryController;
use App\Http\Controllers\Api\Agent\FinancialMetricsController;
use App\Http\Controllers\Api\Agent\MeetingLinkNeededController;
use App\Http\Controllers\Api\Agent\ProductBriefController;
use App\Http\Controllers\Api\Agent\RecordingsPendingController;
use App\Http\Controllers\Api\Agent\RevenueSummaryController;
use App\Http\Controllers\Api\Agent\ScheduleController;
use App\Http\Controllers\Api\Agent\UpdateMeetingLinkController;
use App\Http\Controllers\Api\Agent\UpdateRecordingUrlController;
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

// Route::post('/xendit/callback', [InvoiceController::class, 'callbackXendit'])->name('xendit.callback');
Route::post('/doku/callback', [InvoiceController::class, 'callbackDoku'])->name('doku.callback');

Route::get('/search', [SearchController::class, 'search']);

// Public API Routes
Route::middleware(['auth:sanctum', 'token.ability:external-api'])->group(function () {
    Route::get('/users', [UserApiController::class, 'index'])->name('api.users.index');
    Route::get('/users/{id}', [UserApiController::class, 'show'])->name('api.users.show');

    Route::get('/invoices', [InvoiceApiController::class, 'index'])->name('api.invoices.index');
    Route::get('/invoices/statistics', [InvoiceApiController::class, 'statistics'])->name('api.invoices.statistics');
    Route::get('/invoices/{id}', [InvoiceApiController::class, 'show'])->name('api.invoices.show');
});

// AI Agent (Hermes) — read-only, tanpa data pribadi. Token: php artisan agent:token <agent>
Route::prefix('v1/agent')
    ->middleware(['agent.audit', 'auth:sanctum', 'throttle:agent'])
    ->name('api.agent.')
    ->group(function () {
        Route::middleware('token.ability:agent:read')->group(function () {
            Route::get('/catalog-summary', CatalogSummaryController::class)->name('catalog-summary');
            Route::get('/schedules-and-recordings', ScheduleController::class)->name('schedules-and-recordings');
            Route::get('/schedules-needing-meeting-link', MeetingLinkNeededController::class)->name('schedules-needing-meeting-link');
            Route::get('/recordings-pending', RecordingsPendingController::class)->name('recordings-pending');
            Route::get('/revenue-summary', RevenueSummaryController::class)->name('revenue-summary');
            Route::get('/product-brief', ProductBriefController::class)->name('product-brief');
            Route::get('/financial-metrics', FinancialMetricsController::class)->name('financial-metrics');
        });

        Route::post('/update-meeting-link', UpdateMeetingLinkController::class)
            ->middleware('token.ability:agent:write-meeting')
            ->name('update-meeting-link');
        Route::post('/update-recording-url', UpdateRecordingUrlController::class)
            ->middleware('token.ability:agent:write-recording')
            ->name('update-recording-url');
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