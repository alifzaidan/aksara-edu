<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AffiliateController;
use App\Http\Controllers\AffiliateEarningController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\BootcampController;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\BundleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateDesignController;
use App\Http\Controllers\CertificateParticipantController;
use App\Http\Controllers\CertificateSignController;
use App\Http\Controllers\CertificationProgramController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseDetailController;
use App\Http\Controllers\EnrollmentProgressController;
use App\Http\Controllers\CourseRatingController;
use App\Http\Controllers\DiscountCodeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\LessonAssignmentController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\PrivateClassController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\User\CourseController as UserCourseController;
use App\Http\Controllers\User\BootcampController as UserBootcampController;
use App\Http\Controllers\User\BundleController as UserBundleController;
use App\Http\Controllers\User\CertificationProgramController as UserCertificationProgramController;
use App\Http\Controllers\User\PrivateController as UserPrivateController;
use App\Http\Controllers\User\WebinarController as UserWebinarController;
use App\Http\Controllers\User\ArticleController as UserArticleController;
use App\Http\Controllers\User\MentorController as UserMentorController;
use App\Http\Controllers\User\HomeController;
use App\Http\Controllers\User\Profile\BootcampController as ProfileBootcampController;
use App\Http\Controllers\User\Profile\CertificationProgramController as ProfileCertificationProgramController;
use App\Http\Controllers\User\Profile\CourseController as ProfileCourseController;
use App\Http\Controllers\User\Profile\TransactionController as ProfileTransactionController;
use App\Http\Controllers\User\Profile\WebinarController as ProfileWebinarController;
use App\Http\Controllers\User\Profile\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebinarController;
use App\Http\Controllers\User\QuizController as UserQuizController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::post('/auto-login', function (Request $request) {
    try {
        $request->validate([
            'email' => 'required|email',
            'phone_number' => 'required|string',
        ]);

        $user = User::where('email', $request->email)
            ->where('phone_number', $request->phone_number)
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau nomor telepon tidak sesuai'
            ], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Auto-login error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
})->name('auto-login');

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/terms-and-conditions', [LegalController::class, 'termsAndConditions'])->name('terms-and-conditions');
Route::get('/privacy-policy', [LegalController::class, 'privacyPolicy'])->name('privacy-policy');
Route::get('/course', [UserCourseController::class, 'index'])->name('course.index');
Route::get('/course/{course:slug}', [UserCourseController::class, 'detail'])->name('course.detail');
Route::get('/bootcamp', [UserBootcampController::class, 'index'])->name('bootcamp.index');
Route::get('/bootcamp/{bootcamp:slug}', [UserBootcampController::class, 'detail'])->name('bootcamp.detail');
Route::get('/webinar', [UserWebinarController::class, 'index'])->name('webinar.index');
Route::get('/webinar/{webinar:slug}', [UserWebinarController::class, 'detail'])->name('webinar.detail');
Route::get('/private', [UserPrivateController::class, 'index'])->name('private.index');
Route::get('/private/{privateClass:slug}', [UserPrivateController::class, 'detail'])->name('private.detail');
Route::get('/bundle', [UserBundleController::class, 'index'])->name('bundle.index');
Route::get('/bundle/{bundle:slug}', [UserBundleController::class, 'detail'])->name('bundle.detail');
Route::get('/certification-programs', [UserCertificationProgramController::class, 'index'])->name('certification-programs.index');
Route::get('/certification-programs/{program:slug}', [UserCertificationProgramController::class, 'detail'])->name('certification-programs.detail');
Route::get('/certificate/{code}', [CertificateParticipantController::class, 'show'])->name('certificate.participant.detail');
Route::get('/certificate/{code}/pdf', [CertificateParticipantController::class, 'viewPdf'])->name('certificate.participant.pdf');
Route::get('/certificate/{code}/download', [CertificateParticipantController::class, 'downloadPdf'])->name('certificate.participant.download.public');
Route::get('/check-certificate', [CertificateParticipantController::class, 'checkForm'])->name('certificates.check');
Route::get('/article', [UserArticleController::class, 'index'])->name('article.index');
Route::get('/article/{slug}', [UserArticleController::class, 'show'])->name('article.show');
Route::get('/mentor', [UserMentorController::class, 'index'])->name('mentor.index');
Route::get('/mentor/{id}', [UserMentorController::class, 'show'])->name('mentor.show');

Route::get('/course/{course:slug}/checkout', [UserCourseController::class, 'showCheckout'])->name('course.checkout');
Route::get('/bootcamp/{bootcamp:slug}/register', [UserBootcampController::class, 'showRegister'])->name('bootcamp.register');
Route::get('/webinar/{webinar:slug}/register', [UserWebinarController::class, 'showRegister'])->name('webinar.register');
Route::get('/private/{privateClass:slug}/register', [UserPrivateController::class, 'showRegister'])->name('private.register');
Route::get('/bundle/{bundle:slug}/checkout', [UserBundleController::class, 'showCheckout'])->name('bundle.checkout');
Route::get('/certification-programs/{program:slug}/register', [UserCertificationProgramController::class, 'showRegister'])->name('certification-programs.register');
Route::get('/certification-programs/{program:slug}/scholarship-apply', [UserCertificationProgramController::class, 'scholarshipApply'])->name('certification-programs.scholarship-apply');
Route::post('/certification-programs/{program:slug}/scholarship-store', [UserCertificationProgramController::class, 'scholarshipStore'])->name('certification-programs.scholarship-store');
Route::get('/certification-programs/{program:slug}/scholarship-success', [UserCertificationProgramController::class, 'scholarshipSuccess'])->name('certification-programs.scholarship-success');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/course/checkout/success', [UserCourseController::class, 'showCheckoutSuccess'])->name('course.checkout.success');
    Route::get('/bootcamp/register/success', [UserBootcampController::class, 'showRegisterSuccess'])->name('bootcamp.register.success');
    Route::get('/webinar/register/success', [UserWebinarController::class, 'showRegisterSuccess'])->name('webinar.register.success');
    Route::get('/private/register/success', [UserPrivateController::class, 'showRegisterSuccess'])->name('private.register.success');

    Route::post('/invoice', [InvoiceController::class, 'store'])->name('invoice.store');
    Route::post('/invoice-bundle', [InvoiceController::class, 'storeBundle'])->name('invoice.store.bundle');
    Route::post('/enroll/free', [InvoiceController::class, 'enrollFree'])->name('enroll.free');
    Route::post('/certification-programs/{program:slug}/apply-regular', [UserCertificationProgramController::class, 'applyRegular'])->name('certification-programs.apply-regular');
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
    Route::get('/profile/my-certification-programs', [ProfileCertificationProgramController::class, 'index'])->name('profile.certification-programs');
    Route::get('/profile/my-certification-programs/{program}', [ProfileCertificationProgramController::class, 'detail'])->name('profile.certification-program.detail');
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
    Route::post('/lesson/{lesson}/assignment-submit', [LessonAssignmentController::class, 'submit'])->name('lesson.assignment.submit');

    Route::post('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'updateProgress'])->name('enrollment.progress.update');
    Route::get('/enrollment/progress/{courseSlug}', [EnrollmentProgressController::class, 'getProgress'])->name('enrollment.progress.get');

    Route::post('/course/{course}/rating', [CourseRatingController::class, 'store'])->name('course.rating.store');

    Route::get('/invoice/{id}/pdf', [InvoiceController::class, 'generatePDF'])->name('invoice.pdf')->middleware('auth');
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

        Route::resource('broadcasts', BroadcastController::class);
        Route::post('broadcasts/{broadcast}/filtered-users', [BroadcastController::class, 'filteredUsers'])->name('broadcasts.filtered-users');
        Route::post('broadcasts/{broadcast}/send', [BroadcastController::class, 'send'])->name('broadcasts.send');
        Route::post('broadcasts/{broadcast}/send-single', [BroadcastController::class, 'sendSingle'])->name('broadcasts.send-single');
        Route::resource('certificates', CertificateController::class);
        Route::get('/{certificate}/preview', [CertificateController::class, 'preview'])->name('certificates.preview');
        Route::get('/{certificate}/download-all', [CertificateController::class, 'downloadAll'])->name('certificates.download.all');
        Route::get('/participant/{participant}/download', [CertificateController::class, 'downloadParticipant'])->name('certificates.participant.download');
        Route::get('/certificates/{certificate}/download-grades-template', [CertificateController::class, 'downloadGradesTemplate'])->name('certificates.download-grades-template');
        Route::post('/certificates/{certificate}/import-grades', [CertificateController::class, 'importGrades'])->name('certificates.import-grades');
        Route::get('/certificates/{certificate}/download-participants-template', [CertificateController::class, 'downloadParticipantsTemplate'])->name('certificates.download-participants-template');
        Route::post('/certificates/{certificate}/import-manual-participants', [CertificateController::class, 'importManualParticipants'])->name('certificates.import-manual-participants');
        Route::resource('certificate-designs', CertificateDesignController::class);
        Route::resource('certificate-signs', CertificateSignController::class);

        Route::resource('bootcamps', BootcampController::class);
        Route::post('/bootcamps/{bootcamp}/publish', [BootcampController::class, 'publish'])->name('bootcamps.publish');
        Route::post('/bootcamps/{bootcamp}/archive', [BootcampController::class, 'archive'])->name('bootcamps.archive');
        Route::post('/bootcamps/{bootcamp}/duplicate', [BootcampController::class, 'duplicate'])->name('bootcamps.duplicate');
        Route::post('/bootcamps/{bootcamp}/hidden', [BootcampController::class, 'hidden'])->name('bootcamps.hidden');
        Route::post('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'addScheduleRecording'])->name('bootcamps.add-recording');
        Route::delete('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'removeScheduleRecording'])->name('bootcamps.remove-recording');

        Route::resource('certification-programs', CertificationProgramController::class);
        Route::post('/certification-programs/{program}/publish', [CertificationProgramController::class, 'publish'])->name('certification-programs.publish');
        Route::post('/certification-programs/{program}/archive', [CertificationProgramController::class, 'archive'])->name('certification-programs.archive');
        Route::post('/certification-programs/{program}/hidden', [CertificationProgramController::class, 'hidden'])->name('certification-programs.hidden');
        Route::post('/certification-programs/{program}/schedules/{schedule}/recording', [CertificationProgramController::class, 'addScheduleRecording'])->name('certification-programs.add-recording');
        Route::delete('/certification-programs/{program}/schedules/{schedule}/recording', [CertificationProgramController::class, 'removeScheduleRecording'])->name('certification-programs.remove-recording');
        Route::post('/certification-programs/{program}/socialization-schedules/{schedule}/recording', [CertificationProgramController::class, 'addSocializationRecording'])->name('certification-programs.add-socialization-recording');
        Route::delete('/certification-programs/{program}/socialization-schedules/{schedule}/recording', [CertificationProgramController::class, 'removeSocializationRecording'])->name('certification-programs.remove-socialization-recording');
        Route::post('/certification-programs/{program}/applications/{application}/approve', [CertificationProgramController::class, 'approveApplication'])->name('certification-programs.applications.approve');
        Route::post('/certification-programs/{program}/applications/{application}/reject', [CertificationProgramController::class, 'rejectApplication'])->name('certification-programs.applications.reject');
        Route::post('/certification-programs/{program}/scholarship-applications/{application}/approve', [CertificationProgramController::class, 'approveScholarshipApplication'])->name('certification-programs.scholarship-applications.approve');
        Route::post('/certification-programs/{program}/scholarship-applications/{application}/reject', [CertificationProgramController::class, 'rejectScholarshipApplication'])->name('certification-programs.scholarship-applications.reject');

        Route::resource('webinars', WebinarController::class);
        Route::post('/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::patch('webinars/{webinar}/add-recording', [WebinarController::class, 'addRecording'])->name('webinars.add-recording');
        Route::delete('/webinars/{id}/recording', [WebinarController::class, 'removeRecording'])->name('webinars.recording.remove');

        Route::resource('privates', PrivateClassController::class);
        Route::post('/privates/{private}/publish', [PrivateClassController::class, 'publish'])->name('privates.publish');
        Route::post('/privates/{private}/archive', [PrivateClassController::class, 'archive'])->name('privates.archive');
        Route::post('/privates/{private}/duplicate', [PrivateClassController::class, 'duplicate'])->name('privates.duplicate');

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
        Route::post('/lesson-assignment-submissions/{submission}/approve', [LessonAssignmentController::class, 'approve'])->name('lesson-assignments.approve');
        Route::post('/lesson-assignment-submissions/{submission}/reject', [LessonAssignmentController::class, 'reject'])->name('lesson-assignments.reject');

        Route::resource('discount-codes', DiscountCodeController::class);
        Route::get('transactions', [InvoiceController::class, 'index'])->name('transactions.index');

        Route::resource('promotions', PromotionController::class);
        Route::patch('promotions/{promotion}/toggle-status', [PromotionController::class, 'toggleStatus'])->name('promotions.toggle-status');
        Route::get('transactions/export', [InvoiceController::class, 'export'])->name('transactions.export');
    });

    Route::middleware(['role:affiliate|admin'])->group(function () {
        Route::get('bootcamps', [BootcampController::class, 'index'])->name('bootcamps.index');
        Route::get('bootcamps/{bootcamp}', [BootcampController::class, 'show'])->name('bootcamps.show');

        Route::get('webinars', [WebinarController::class, 'index'])->name('webinars.index');
        Route::get('webinars/{webinar}', [WebinarController::class, 'show'])->name('webinars.show');

        Route::get('privates', [PrivateClassController::class, 'index'])->name('privates.index');
        Route::get('privates/{private}', [PrivateClassController::class, 'show'])->name('privates.show');
    });

    Route::middleware(['role:affiliate|mentor|admin'])->group(function () {
        Route::get('affiliate-earnings', [AffiliateEarningController::class, 'index'])->name('earnings.index');
        Route::get('affiliate-earnings/export', [AffiliateEarningController::class, 'export'])->name('earnings.export');
    });
});

Route::post('/api/discount-codes/validate', [DiscountCodeController::class, 'validate'])->name('api.discount-codes.validate');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

Route::fallback(function () {
    return Inertia::render('errors/not-found');
});
