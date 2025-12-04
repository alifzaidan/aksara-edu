<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AffiliateEarningController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\BundleController;
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
use App\Http\Controllers\PartnershipProductController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\User\CourseController as UserCourseController;
use App\Http\Controllers\User\BootcampController as UserBootcampController;
use App\Http\Controllers\User\BundleController as UserBundleController;
use App\Http\Controllers\User\WebinarController as UserWebinarController;
use App\Http\Controllers\User\PartnershipProductController as UserPartnershipProductController;
use App\Http\Controllers\User\ArticleController as UserArticleController;
use App\Http\Controllers\User\MentorController as UserMentorController;
use App\Http\Controllers\User\HomeController;
use App\Http\Controllers\User\Profile\BootcampController as ProfileBootcampController;
use App\Http\Controllers\User\Profile\CourseController as ProfileCourseController;
use App\Http\Controllers\User\Profile\TransactionController as ProfileTransactionController;
use App\Http\Controllers\User\Profile\WebinarController as ProfileWebinarController;
use App\Http\Controllers\User\Profile\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebinarController;
use App\Http\Controllers\User\QuizController as UserQuizController;
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
Route::get('/bundle', [UserBundleController::class, 'index'])->name('bundle.index');
Route::get('/bundle/{bundle:slug}', [UserBundleController::class, 'detail'])->name('bundle.detail');
Route::get('/certification', [UserPartnershipProductController::class, 'index'])->name('partnership-product.index');
Route::get('/certification/{partnershipProduct:slug}', [UserPartnershipProductController::class, 'detail'])->name('partnership-product.detail');
Route::get('/certificate/{code}', [CertificateParticipantController::class, 'show'])->name('certificate.participant.detail');
Route::get('/article', [UserArticleController::class, 'index'])->name('article.index');
Route::get('/article/{slug}', [UserArticleController::class, 'show'])->name('article.show');
Route::get('/mentor', [UserMentorController::class, 'index'])->name('mentor.index');
Route::get('/mentor/{id}', [UserMentorController::class, 'show'])->name('mentor.show');

Route::get('/course/{course:slug}/checkout', [UserCourseController::class, 'showCheckout'])->name('course.checkout');
Route::get('/bootcamp/{bootcamp:slug}/register', [UserBootcampController::class, 'showRegister'])->name('bootcamp.register');
Route::get('/webinar/{webinar:slug}/register', [UserWebinarController::class, 'showRegister'])->name('webinar.register');
Route::get('/bundle/{bundle:slug}/checkout', [UserBundleController::class, 'showCheckout'])->name('bundle.checkout');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/course/checkout/success', [UserCourseController::class, 'showCheckoutSuccess'])->name('course.checkout.success');
    Route::get('/bootcamp/register/success', [UserBootcampController::class, 'showRegisterSuccess'])->name('bootcamp.register.success');
    Route::get('/webinar/register/success', [UserWebinarController::class, 'showRegisterSuccess'])->name('webinar.register.success');
    Route::get('/certification/{partnershipProduct:slug}/track-click', [UserPartnershipProductController::class, 'trackClick'])->name('partnership-products.track-click');

    Route::post('/invoice', [InvoiceController::class, 'store'])->name('invoice.store');
    Route::post('/invoice-bundle', [InvoiceController::class, 'storeBundle'])->name('invoice.store.bundle');
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
    Route::post('/profile/my-bootcamps/attendance/upload', [ProfileBootcampController::class, 'uploadAttendanceProof'])->name('profile.bootcamp.attendance.upload');
    Route::post('/profile/my-bootcamps/submission/submit', [ProfileBootcampController::class, 'submitSubmission'])->name('profile.bootcamp.submission.submit');
    Route::post('/profile/my-bootcamps/review/submit', [ProfileBootcampController::class, 'submitReview'])->name('profile.bootcamp.review.submit');
    Route::get('/profile/my-bootcamps/{bootcamp}/certificate', [ProfileBootcampController::class, 'downloadCertificate'])->name('profile.bootcamp.certificate');
    Route::get('/profile/my-bootcamps/{bootcamp}/certificate/preview', [ProfileBootcampController::class, 'previewCertificate'])->name('profile.bootcamp.certificate.preview');
    Route::get('/profile/my-webinars', [ProfileWebinarController::class, 'index'])->name('profile.webinars');
    Route::get('/profile/my-webinars/{webinar}', [ProfileWebinarController::class, 'detail'])->name('profile.webinar.detail');
    Route::post('/profile/my-webinar/attendance-review/submit', [ProfileWebinarController::class, 'submitAttendanceAndReview'])->name('profile.webinar.attendance-review.submit');
    Route::get('/profile/my-webinars/{webinar}/certificate', [ProfileWebinarController::class, 'downloadCertificate'])->name('profile.webinar.certificate');
    Route::get('/profile/my-webinars/{webinar}/certificate/preview', [ProfileWebinarController::class, 'previewCertificate'])->name('profile.webinar.certificate.preview');
    Route::get('/profile/transactions', [ProfileTransactionController::class, 'index'])->name('profile.transactions');
    Route::get('/profile/transactions/{invoice}', [ProfileTransactionController::class, 'show'])->name('profile.transaction.detail');

    Route::redirect('learn', 'profile/my-courses');
    Route::redirect('learn/course', 'profile/my-courses');
    Route::get('/learn/course/{course:slug}', [CourseDetailController::class, 'index'])
        ->middleware('enrollment.check')
        ->name('learn.course.detail');

    Route::prefix('quiz')->name('quiz.')->middleware(['quiz.access'])->group(function () {
        Route::get('/{quizId}', [UserQuizController::class, 'show'])->name('show');
        Route::get('/{quizId}/start', [UserQuizController::class, 'start'])->name('start');
        Route::post('/{quizId}/submit', [UserQuizController::class, 'submit'])->name('submit');
        Route::delete('/{quizId}/cancel', [UserQuizController::class, 'cancel'])->name('cancel');
        Route::get('/{quizId}/result', [UserQuizController::class, 'result'])->name('result');
        Route::get('/{quizId}/answers', [UserQuizController::class, 'answers'])->name('answers');
        Route::get('/{quizId}/history', [UserQuizController::class, 'history'])->name('history');
    });

    Route::get('/learn/course/{course:slug}/quiz/{lesson}', [CourseDetailController::class, 'showQuiz'])
        ->middleware('enrollment.check')
        ->name('learn.course.quiz');
    Route::post('/lesson/{lesson}/complete', [App\Http\Controllers\LessonController::class, 'markComplete'])->name('lesson.complete');

    Route::post('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'updateProgress'])->name('enrollment.progress.update');
    Route::get('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'getProgress'])->name('enrollment.progress.get');

    Route::post('/course/{course}/rating', [CourseRatingController::class, 'store'])->name('course.rating.store');

    Route::get('/invoice/{id}/pdf', [InvoiceController::class, 'generatePDF'])->name('invoice.pdf')->middleware('auth');
    Route::post('/api/discount-codes/validate', [DiscountCodeController::class, 'validate'])->name('api.discount-codes.validate');
});

Route::middleware(['auth', 'verified', 'role:admin|mentor|affiliate'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard');
    Route::get('dashboard', [AdminController::class, 'index'])->name('dashboard');

    // dapat diakses oleh admin, mentor, dan affiliate
    Route::resource('courses', CourseController::class);

    Route::middleware(['role:admin|mentor'])->group(function () {
        Route::resource('categories', CategoryController::class);
        Route::resource('tools', ToolController::class);
        Route::post('/tools/{id}', [ToolController::class, 'update'])->name('tools.update');

        Route::post('/courses/{course}/publish', [CourseController::class, 'publish'])->name('courses.publish');
        Route::post('/courses/{course}/archive', [CourseController::class, 'archive'])->name('courses.archive');
        Route::post('/courses/{course}/duplicate', [CourseController::class, 'duplicate'])->name('courses.duplicate');
        Route::get('/courses/{course}/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::get('/courses/{course}/quizzes/{quiz}/questions/create', [QuestionController::class, 'create'])->name('questions.create');
        Route::get('/courses/{course}/quizzes/{quiz}/questions/{question}/edit', [QuestionController::class, 'edit'])->name('questions.edit');
        Route::post('/questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::put('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
        Route::post('/questions/import', [QuestionController::class, 'import'])->name('questions.import');

        Route::resource('articles', ArticleController::class);
        Route::post('/articles/{article}/duplicate', [ArticleController::class, 'duplicate'])->name('articles.duplicate');
    });

    Route::middleware(['role:admin'])->group(function () {
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
        Route::post('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'addScheduleRecording'])->name('bootcamps.add-recording');
        Route::delete('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'removeScheduleRecording'])->name('bootcamps.remove-recording');

        Route::resource('webinars', WebinarController::class);
        Route::post('/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::patch('webinars/{webinar}/add-recording', [WebinarController::class, 'addRecording'])->name('webinars.add-recording');
        Route::delete('/webinars/{id}/recording', [WebinarController::class, 'removeRecording'])->name('webinars.recording.remove');

        Route::resource('partnership-products', PartnershipProductController::class);
        Route::post('/partnership-products/{id}/publish', [PartnershipProductController::class, 'publish'])->name('partnership-products.publish');
        Route::post('/partnership-products/{id}/archive', [PartnershipProductController::class, 'archive'])->name('partnership-products.archive');
        Route::post('/partnership-products/{id}/duplicate', [PartnershipProductController::class, 'duplicate'])->name('partnership-products.duplicate');
        Route::get('/partnership-products/stats/overview', [PartnershipProductController::class, 'statistics'])->name('partnership-products.statistics');
        Route::post('/partnership-products/bulk-action', [PartnershipProductController::class, 'bulkAction'])->name('partnership-products.bulk-action');

        Route::resource('bundles', BundleController::class);
        Route::post('/bundles/{bundle}/publish', [BundleController::class, 'publish'])->name('bundles.publish');
        Route::post('/bundles/{bundle}/archive', [BundleController::class, 'archive'])->name('bundles.archive');
        Route::post('/bundles/{bundle}/duplicate', [BundleController::class, 'duplicate'])->name('bundles.duplicate');

        Route::resource('affiliates', AffiliateController::class);
        Route::post('affiliates/{affiliate}/toggle-status', [AffiliateController::class, 'toggleStatus'])->name('affiliates.toggleStatus');
        Route::post('affiliate-earnings/{earning}/approve', [AffiliateEarningController::class, 'approveEarning'])->name('earnings.approve');
        Route::post('affiliate-earnings/{earning}/reject', [AffiliateEarningController::class, 'rejectEarning'])->name('earnings.reject');
        Route::post('affiliates/{affiliate}/withdraw', [AffiliateController::class, 'withdrawCommission'])->name('affiliates.withdraw');

        Route::resource('mentors', MentorController::class);
        Route::post('/mentors/{mentor}/withdraw', [MentorController::class, 'withdrawCommission'])->name('mentors.withdraw');

        Route::post('/articles/{article}/publish', [ArticleController::class, 'publish'])->name('articles.publish');
        Route::post('/articles/{article}/archive', [ArticleController::class, 'archive'])->name('articles.archive');

        Route::post('/course-ratings/{rating}/approve', [CourseRatingController::class, 'approve'])->name('course-ratings.approve');
        Route::post('/course-ratings/{rating}/reject', [CourseRatingController::class, 'reject'])->name('course-ratings.reject');

        Route::resource('discount-codes', DiscountCodeController::class);
        Route::get('transactions', [InvoiceController::class, 'index'])->name('transactions.index');

        Route::resource('promotions', PromotionController::class);
        Route::patch('promotions/{promotion}/toggle-status', [PromotionController::class, 'toggleStatus'])->name('promotions.toggle-status');
    });

    Route::middleware(['role:affiliate|admin'])->group(function () {
        Route::get('bootcamps', [BootcampController::class, 'index'])->name('bootcamps.index');
        Route::get('bootcamps/{bootcamp}', [BootcampController::class, 'show'])->name('bootcamps.show');

        Route::get('webinars', [WebinarController::class, 'index'])->name('webinars.index');
        Route::get('webinars/{webinar}', [WebinarController::class, 'show'])->name('webinars.show');
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
