<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AffiliateEarningController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateDesignController;
use App\Http\Controllers\CertificateParticipantController;
use App\Http\Controllers\CertificateSignController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseDetailController;
use App\Http\Controllers\EnrollmentProgressController;
use App\Http\Controllers\CourseRatingController;
use App\Http\Controllers\DiscountCodeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuizSubmissionController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\User\CourseController as UserCourseController;
use App\Http\Controllers\User\BootcampController as UserBootcampController;
use App\Http\Controllers\User\WebinarController as UserWebinarController;
use App\Http\Controllers\User\HomeController;
use App\Http\Controllers\User\Profile\BootcampController as ProfileBootcampController;
use App\Http\Controllers\User\Profile\CourseController as ProfileCourseController;
use App\Http\Controllers\User\Profile\TransactionController as ProfileTransactionController;
use App\Http\Controllers\User\Profile\WebinarController as ProfileWebinarController;
use App\Http\Controllers\User\Profile\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebinarController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/terms-and-conditions', [LegalController::class, 'termsAndConditions'])->name('terms-and-conditions');
Route::get('/privacy-policy', [LegalController::class, 'privacyPolicy'])->name('privacy-policy');
Route::get('/course', [UserCourseController::class, 'index'])->name('course.index');
Route::get('/course/{course:slug}', [UserCourseController::class, 'detail'])->name('course.detail');
Route::get('/bootcamp', [UserBootcampController::class, 'index'])->name('bootcamp.index');
Route::get('/bootcamp/{bootcamp:slug}', [UserBootcampController::class, 'detail'])->name('bootcamp.detail');
Route::get('/webinar', [UserWebinarController::class, 'index'])->name('webinar.index');
Route::get('/webinar/{webinar:slug}', [UserWebinarController::class, 'detail'])->name('webinar.detail');
Route::get('/certificate/{code}', [CertificateParticipantController::class, 'show'])->name('certificate.participant.detail');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/course/{course:slug}/checkout', [UserCourseController::class, 'showCheckout'])->name('course.checkout');
    Route::get('/bootcamp/{bootcamp:slug}/register', [UserBootcampController::class, 'showRegister'])->name('bootcamp.register');
    Route::get('/webinar/{webinar:slug}/register', [UserWebinarController::class, 'showRegister'])->name('webinar.register');

    Route::get('/course/checkout/success', [UserCourseController::class, 'showCheckoutSuccess'])->name('course.checkout.success');
    Route::get('/bootcamp/register/success', [UserBootcampController::class, 'showRegisterSuccess'])->name('bootcamp.register.success');
    Route::get('/webinar/register/success', [UserWebinarController::class, 'showRegisterSuccess'])->name('webinar.register.success');

    Route::post('/invoice', [InvoiceController::class, 'store'])->name('invoice.store');
    Route::post('/enroll/free', [InvoiceController::class, 'enrollFree'])->name('enroll.free');
    Route::get('/invoice/{id}', [InvoiceController::class, 'show'])->name('invoice.show');
    Route::post('/invoice/{id}/cancel', [InvoiceController::class, 'cancel'])->name('invoice.cancel');
    Route::post('/invoice/expire-old', [InvoiceController::class, 'expireOldInvoices'])->name('invoice.expire-old');

    Route::redirect('profile', 'profile/dashboard');
    Route::get('/profile/dashboard', [ProfileController::class, 'index'])->name('profile.index');
    Route::get('/profile/my-courses', [ProfileCourseController::class, 'index'])->name('profile.courses');
    Route::get('/profile/my-courses/{course}', [ProfileCourseController::class, 'detail'])->name('profile.course.detail');
    Route::get('/profile/my-courses/{course}/certificate', [ProfileCourseController::class, 'downloadCertificate'])->name('profile.course.certificate');
    Route::get('/profile/my-courses/{course}/certificate/preview', [ProfileCourseController::class, 'previewCertificate'])->name('profile.course.certificate.preview');
    Route::get('/profile/my-bootcamps', [ProfileBootcampController::class, 'index'])->name('profile.bootcamps');
    Route::get('/profile/my-bootcamps/{bootcamp}', [ProfileBootcampController::class, 'detail'])->name('profile.bootcamp.detail');
    Route::get('/profile/my-bootcamps/{bootcamp}/certificate', [ProfileBootcampController::class, 'downloadCertificate'])->name('profile.bootcamp.certificate');
    Route::get('/profile/my-bootcamps/{bootcamp}/certificate/preview', [ProfileBootcampController::class, 'previewCertificate'])->name('profile.bootcamp.certificate.preview');
    Route::get('/profile/my-webinars', [ProfileWebinarController::class, 'index'])->name('profile.webinars');
    Route::get('/profile/my-webinars/{webinar}', [ProfileWebinarController::class, 'detail'])->name('profile.webinar.detail');
    Route::get('/profile/my-webinars/{webinar}/certificate', [ProfileWebinarController::class, 'downloadCertificate'])->name('profile.webinar.certificate');
    Route::get('/profile/my-webinars/{webinar}/certificate/preview', [ProfileWebinarController::class, 'previewCertificate'])->name('profile.webinar.certificate.preview');
    Route::get('/profile/transactions', [ProfileTransactionController::class, 'index'])->name('profile.transactions');
    Route::get('/profile/transactions/{invoice}', [ProfileTransactionController::class, 'show'])->name('profile.transaction.detail');

    Route::redirect('learn', 'profile/my-courses');
    Route::redirect('learn/course', 'profile/my-courses');
    Route::get('/learn/course/{course:slug}', [CourseDetailController::class, 'index'])
        ->middleware('enrollment.check')
        ->name('learn.course.detail');

    Route::get('/learn/course/{course:slug}/quiz/{lesson}', [CourseDetailController::class, 'showQuiz'])
        ->middleware('enrollment.check')
        ->name('learn.course.quiz');
    Route::post('/quiz/submit', [QuizSubmissionController::class, 'submit'])->name('quiz.submit');
    Route::get('/quiz/{quiz}/attempt', [QuizSubmissionController::class, 'getAttempt'])->name('quiz.attempt');
    Route::post('/quiz/save-progress', [App\Http\Controllers\QuizProgressController::class, 'save']);
    Route::get('/quiz/get-progress', [App\Http\Controllers\QuizProgressController::class, 'get']);
    Route::post('/quiz/clear-progress', [App\Http\Controllers\QuizProgressController::class, 'clear'])->middleware('auth');
    Route::post('/lesson/{lesson}/complete', [App\Http\Controllers\LessonController::class, 'markComplete'])->name('lesson.complete');

    Route::post('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'updateProgress'])->name('enrollment.progress.update');
    Route::get('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'getProgress'])->name('enrollment.progress.get');

    Route::post('/course/{course}/rating', [CourseRatingController::class, 'store'])->name('course.rating.store');

    Route::get('/invoice/{id}/pdf', [InvoiceController::class, 'generatePDF'])->name('invoice.pdf')->middleware('auth');
});

Route::middleware(['auth', 'verified', 'role:admin|mentor|affiliate'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard');
    Route::get('dashboard', [AdminController::class, 'index'])->name('dashboard');

    Route::middleware(['role:admin|mentor'])->group(function () {
        Route::resource('categories', CategoryController::class);
        Route::resource('tools', ToolController::class);
        Route::post('/tools/{id}', [ToolController::class, 'update'])->name('tools.update');

        Route::resource('courses', CourseController::class);
        Route::post('/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
        Route::post('/courses/{course}/archive', [CourseController::class, 'archive'])->name('courses.archive');
        Route::post('/courses/{course}/duplicate', [CourseController::class, 'duplicate'])->name('courses.duplicate');
        Route::get('/courses/{course}/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::post('/questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::put('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    });

    Route::middleware(['role:admin'])->group(function () {
        Route::resource('mentors', MentorController::class);
        Route::resource('users', UserController::class);
        Route::resource('certificates', CertificateController::class);
        Route::get('/{certificate}/preview', [CertificateController::class, 'preview'])->name('certificates.preview');
        Route::get('/{certificate}/download-all', [CertificateController::class, 'downloadAll'])->name('certificates.download.all');
        Route::get('/participant/{participant}/download', [CertificateController::class, 'downloadParticipant'])->name('certificates.participant.download');
        Route::resource('certificate-designs', CertificateDesignController::class);
        Route::resource('certificate-signs', CertificateSignController::class);

        Route::resource('bootcamps', BootcampController::class);
        Route::post('/bootcamps/{bootcamp}/publish', [BootcampController::class, 'publish'])->name('bootcamps.publish');
        Route::post('/bootcamps/{bootcamp}/archive', [BootcampController::class, 'archive'])->name('bootcamps.archive');
        Route::post('/bootcamps/{bootcamp}/duplicate', [BootcampController::class, 'duplicate'])->name('bootcamps.duplicate');

        Route::resource('webinars', WebinarController::class);
        Route::post('/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::patch('webinars/{webinar}/add-recording', [WebinarController::class, 'addRecording'])->name('webinars.add-recording');

        Route::resource('affiliates', AffiliateController::class);
        Route::post('affiliates/{affiliate}/toggle-status', [AffiliateController::class, 'toggleStatus'])->name('affiliates.toggleStatus');
        Route::post('affiliate-earnings/{earning}/approve', [AffiliateEarningController::class, 'approveEarning'])->name('earnings.approve');
        Route::post('affiliate-earnings/{earning}/reject', [AffiliateEarningController::class, 'rejectEarning'])->name('earnings.reject');

        Route::post('/course-ratings/{rating}/approve', [CourseRatingController::class, 'approve'])->name('course-ratings.approve');
        Route::post('/course-ratings/{rating}/reject', [CourseRatingController::class, 'reject'])->name('course-ratings.reject');

        Route::resource('discount-codes', DiscountCodeController::class);
        Route::get('transactions', [InvoiceController::class, 'index'])->name('transactions.index');
    });

    Route::middleware(['role:affiliate|mentor'])->group(function () {
        Route::get('affiliate-earnings', [AffiliateEarningController::class, 'index'])->name('earnings.index');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

Route::fallback(function () {
    return Inertia::render('errors/not-found');
});
