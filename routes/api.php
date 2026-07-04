<?php

use App\Http\Controllers\Api\InvoiceApiController;
use App\Http\Controllers\Api\UserApiController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\SearchController;
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
    ];

    if ($user) {
        $response['name'] = $user->name;
        $response['phone_number'] = $user->phone_number;
        $response['instance'] = $user->instance;
        $response['city'] = $user->city;
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
