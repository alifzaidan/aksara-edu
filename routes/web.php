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
use App\Http\Controllers\InstallmentController;
use App\Http\Controllers\Admin\InstallmentTermController;
use App\Http\Controllers\WebinarController;
use App\Http\Controllers\User\QuizController as UserQuizController;
use App\Http\Controllers\BiinsightImportController;
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
            'instance' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
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

        $updated = false;
        if ($request->filled('instance') && empty($user->instance)) {
            $user->instance = $request->instance;
            $updated = true;
        }
        if ($request->filled('city') && empty($user->city)) {
            $user->city = $request->city;
            $updated = true;
        }
        if ($updated) {
            $user->save();
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
                'instance' => $user->instance,
                'city' => $user->city,
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

    // Installment routes
    Route::post('/invoice/installment', [InstallmentController::class, 'store'])->name('installment.store');
    Route::post('/installment/{id}/pay', [InstallmentController::class, 'payTerm'])->name('installment.pay-term');
    Route::get('/profile/installments', [InstallmentController::class, 'index'])->name('profile.installments');

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
    Route::get('/profile/referral', [ProfileController::class, 'referral'])->name('profile.referral');

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

    Route::get('/api/user/points', [App\Http\Controllers\ReferralController::class, 'getPoints'])->name('api.user.points');
});

Route::post('/api/referral/validate', [App\Http\Controllers\ReferralController::class, 'validateCode'])->name('api.referral.validate');

Route::middleware(['auth', 'verified', 'role:admin|mentor|affiliate|staff'])->prefix('admin')->group(function () {
    Route::redirect('/', 'admin/dashboard');
    Route::get('dashboard', [AdminController::class, 'index'])->name('dashboard');

    // Staff Management (Admin only)
    Route::middleware(['role:admin'])->group(function () {
        Route::resource('staff', \App\Http\Controllers\StaffController::class);
    });

    // Courses
    Route::middleware(['role_or_permission:admin|mentor|courses.manage'])->group(function () {
        Route::get('courses/create', [CourseController::class, 'create'])->name('courses.create');
        Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
        Route::get('courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
        Route::put('courses/{course}', [CourseController::class, 'update'])->name('courses.update');
        Route::delete('courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');

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
        Route::get('/courses/{course}/quizzes/{quiz}/export', [QuestionController::class, 'export'])->name('questions.export');

        Route::post('/course-ratings/{rating}/approve', [CourseRatingController::class, 'approve'])->name('course-ratings.approve');
        Route::post('/course-ratings/{rating}/reject', [CourseRatingController::class, 'reject'])->name('course-ratings.reject');
        Route::post('/lesson-assignment-submissions/{submission}/approve', [LessonAssignmentController::class, 'approve'])->name('lesson-assignments.approve');
        Route::post('/lesson-assignment-submissions/{submission}/reject', [LessonAssignmentController::class, 'reject'])->name('lesson-assignments.reject');
    });
    Route::middleware(['role_or_permission:admin|mentor|affiliate|courses.view'])->group(function () {
        Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
        Route::get('courses/{course}', [CourseController::class, 'show'])->name('courses.show');
    });

    // Categories
    Route::middleware(['role_or_permission:admin|mentor|categories.manage'])->group(function () {
        Route::get('categories/create', [CategoryController::class, 'create'])->name('categories.create');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::get('categories/{category}/edit', [CategoryController::class, 'edit'])->name('categories.edit');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    });
    Route::middleware(['role_or_permission:admin|mentor|categories.view'])->group(function () {
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::get('categories/{category}', [CategoryController::class, 'show'])->name('categories.show');
    });

    // Tools
    Route::middleware(['role_or_permission:admin|mentor|tools.manage'])->group(function () {
        Route::get('tools/create', [ToolController::class, 'create'])->name('tools.create');
        Route::post('tools', [ToolController::class, 'store'])->name('tools.store');
        Route::get('tools/{tool}/edit', [ToolController::class, 'edit'])->name('tools.edit');
        Route::put('tools/{tool}', [ToolController::class, 'update'])->name('tools.update');
        Route::delete('tools/{tool}', [ToolController::class, 'destroy'])->name('tools.destroy');
        Route::post('/tools/{id}', [ToolController::class, 'update'])->name('tools.update');
    });
    Route::middleware(['role_or_permission:admin|mentor|tools.view'])->group(function () {
        Route::get('tools', [ToolController::class, 'index'])->name('tools.index');
        Route::get('tools/{tool}', [ToolController::class, 'show'])->name('tools.show');
    });

    // Articles
    Route::middleware(['role_or_permission:admin|mentor|articles.manage'])->group(function () {
        Route::get('articles/create', [ArticleController::class, 'create'])->name('articles.create');
        Route::post('articles', [ArticleController::class, 'store'])->name('articles.store');
        Route::get('articles/{article}/edit', [ArticleController::class, 'edit'])->name('articles.edit');
        Route::put('articles/{article}', [ArticleController::class, 'update'])->name('articles.update');
        Route::delete('articles/{article}', [ArticleController::class, 'destroy'])->name('articles.destroy');
        Route::post('/articles/{article}/duplicate', [ArticleController::class, 'duplicate'])->name('articles.duplicate');
        Route::post('/articles/{article}/publish', [ArticleController::class, 'publish'])->name('articles.publish');
        Route::post('/articles/{article}/archive', [ArticleController::class, 'archive'])->name('articles.archive');
    });
    Route::middleware(['role_or_permission:admin|mentor|articles.view'])->group(function () {
        Route::get('articles', [ArticleController::class, 'index'])->name('articles.index');
        Route::get('articles/{article}', [ArticleController::class, 'show'])->name('articles.show');
    });

    // Users
    Route::middleware(['role_or_permission:admin|users.manage'])->group(function () {
        Route::get('users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
    Route::middleware(['role_or_permission:admin|users.view'])->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [UserController::class, 'show'])->name('users.show');
    });

    // Broadcasts
    Route::middleware(['role_or_permission:admin|broadcasts.manage'])->group(function () {
        Route::get('broadcasts/create', [BroadcastController::class, 'create'])->name('broadcasts.create');
        Route::post('broadcasts', [BroadcastController::class, 'store'])->name('broadcasts.store');
        Route::get('broadcasts/{broadcast}/edit', [BroadcastController::class, 'edit'])->name('broadcasts.edit');
        Route::put('broadcasts/{broadcast}', [BroadcastController::class, 'update'])->name('broadcasts.update');
        Route::delete('broadcasts/{broadcast}', [BroadcastController::class, 'destroy'])->name('broadcasts.destroy');
        Route::post('broadcasts/{broadcast}/filtered-users', [BroadcastController::class, 'filteredUsers'])->name('broadcasts.filtered-users');
        Route::post('broadcasts/{broadcast}/send', [BroadcastController::class, 'send'])->name('broadcasts.send');
        Route::post('broadcasts/{broadcast}/send-single', [BroadcastController::class, 'sendSingle'])->name('broadcasts.send-single');
    });
    Route::middleware(['role_or_permission:admin|broadcasts.view'])->group(function () {
        Route::get('broadcasts', [BroadcastController::class, 'index'])->name('broadcasts.index');
        Route::get('broadcasts/{broadcast}', [BroadcastController::class, 'show'])->name('broadcasts.show');
    });

    // Certificates
    Route::middleware(['role_or_permission:admin|certificates.manage'])->group(function () {
        Route::get('certificates/create', [CertificateController::class, 'create'])->name('certificates.create');
        Route::post('certificates', [CertificateController::class, 'store'])->name('certificates.store');
        Route::get('certificates/{certificate}/edit', [CertificateController::class, 'edit'])->name('certificates.edit');
        Route::put('certificates/{certificate}', [CertificateController::class, 'update'])->name('certificates.update');
        Route::delete('certificates/{certificate}', [CertificateController::class, 'destroy'])->name('certificates.destroy');
        Route::get('/certificates/{certificate}/download-grades-template', [CertificateController::class, 'downloadGradesTemplate'])->name('certificates.download-grades-template');
        Route::post('/certificates/{certificate}/import-grades', [CertificateController::class, 'importGrades'])->name('certificates.import-grades');
        Route::get('/certificates/{certificate}/download-participants-template', [CertificateController::class, 'downloadParticipantsTemplate'])->name('certificates.download-participants-template');
        Route::post('/certificates/{certificate}/import-manual-participants', [CertificateController::class, 'importManualParticipants'])->name('certificates.import-manual-participants');
        Route::resource('certificate-designs', CertificateDesignController::class);
        Route::resource('certificate-signs', CertificateSignController::class);
    });
    Route::middleware(['role_or_permission:admin|certificates.view'])->group(function () {
        Route::get('certificates', [CertificateController::class, 'index'])->name('certificates.index');
        Route::get('certificates/{certificate}', [CertificateController::class, 'show'])->name('certificates.show');
        Route::get('certificates/{certificate}/preview', [CertificateController::class, 'preview'])->name('certificates.preview');
        Route::get('certificates/{certificate}/download-all', [CertificateController::class, 'downloadAll'])->name('certificates.download.all');
        Route::get('certificates/participant/{participant}/download', [CertificateController::class, 'downloadParticipant'])->name('certificates.participant.download');
    });

    // Bootcamps
    Route::middleware(['role_or_permission:admin|bootcamps.manage'])->group(function () {
        Route::get('bootcamps/create', [BootcampController::class, 'create'])->name('bootcamps.create');
        Route::post('bootcamps', [BootcampController::class, 'store'])->name('bootcamps.store');
        Route::get('bootcamps/{bootcamp}/edit', [BootcampController::class, 'edit'])->name('bootcamps.edit');
        Route::put('bootcamps/{bootcamp}', [BootcampController::class, 'update'])->name('bootcamps.update');
        Route::delete('bootcamps/{bootcamp}', [BootcampController::class, 'destroy'])->name('bootcamps.destroy');
        Route::post('/bootcamps/{bootcamp}/publish', [BootcampController::class, 'publish'])->name('bootcamps.publish');
        Route::post('/bootcamps/{bootcamp}/archive', [BootcampController::class, 'archive'])->name('bootcamps.archive');
        Route::post('/bootcamps/{bootcamp}/duplicate', [BootcampController::class, 'duplicate'])->name('bootcamps.duplicate');
        Route::post('/bootcamps/{bootcamp}/hidden', [BootcampController::class, 'hidden'])->name('bootcamps.hidden');
        Route::post('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'addScheduleRecording'])->name('bootcamps.add-recording');
        Route::delete('/bootcamps/{bootcamp}/schedules/{schedule}/recording', [BootcampController::class, 'removeScheduleRecording'])->name('bootcamps.remove-recording');
    });
    Route::middleware(['role_or_permission:admin|affiliate|bootcamps.view'])->group(function () {
        Route::get('bootcamps', [BootcampController::class, 'index'])->name('bootcamps.index');
        Route::get('bootcamps/{bootcamp}', [BootcampController::class, 'show'])->name('bootcamps.show');
    });

    // Certification Programs
    Route::middleware(['role_or_permission:admin|certification-programs.manage'])->group(function () {
        Route::get('certification-programs/create', [CertificationProgramController::class, 'create'])->name('certification-programs.create');
        Route::post('certification-programs', [CertificationProgramController::class, 'store'])->name('certification-programs.store');
        Route::get('certification-programs/{program}/edit', [CertificationProgramController::class, 'edit'])->name('certification-programs.edit');
        Route::put('certification-programs/{program}', [CertificationProgramController::class, 'update'])->name('certification-programs.update');
        Route::delete('certification-programs/{program}', [CertificationProgramController::class, 'destroy'])->name('certification-programs.destroy');
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
        Route::post('/certification-programs/{program}/duplicate', [CertificationProgramController::class, 'duplicate'])->name('certification-programs.duplicate');
        Route::get('/biinsight-import/programs', [BiinsightImportController::class, 'getPrograms'])->name('admin.biinsight-import.programs');
    });
    Route::middleware(['role_or_permission:admin|affiliate|certification-programs.view'])->group(function () {
        Route::get('certification-programs', [CertificationProgramController::class, 'index'])->name('certification-programs.index');
        Route::get('certification-programs/{program}', [CertificationProgramController::class, 'show'])->name('certification-programs.show');
    });

    // Webinars
    Route::middleware(['role_or_permission:admin|webinars.manage'])->group(function () {
        Route::get('webinars/create', [WebinarController::class, 'create'])->name('webinars.create');
        Route::post('webinars', [WebinarController::class, 'store'])->name('webinars.store');
        Route::get('webinars/{webinar}/edit', [WebinarController::class, 'edit'])->name('webinars.edit');
        Route::put('webinars/{webinar}', [WebinarController::class, 'update'])->name('webinars.update');
        Route::delete('webinars/{webinar}', [WebinarController::class, 'destroy'])->name('webinars.destroy');
        Route::post('/webinars/{webinar}/publish', [WebinarController::class, 'publish'])->name('webinars.publish');
        Route::post('/webinars/{webinar}/archive', [WebinarController::class, 'archive'])->name('webinars.archive');
        Route::post('/webinars/{webinar}/duplicate', [WebinarController::class, 'duplicate'])->name('webinars.duplicate');
        Route::patch('webinars/{webinar}/add-recording', [WebinarController::class, 'addRecording'])->name('webinars.add-recording');
        Route::delete('/webinars/{id}/recording', [WebinarController::class, 'removeRecording'])->name('webinars.recording.remove');
    });
    Route::middleware(['role_or_permission:admin|affiliate|webinars.view'])->group(function () {
        Route::get('webinars', [WebinarController::class, 'index'])->name('webinars.index');
        Route::get('webinars/{webinar}', [WebinarController::class, 'show'])->name('webinars.show');
    });

    // Privates
    Route::middleware(['role_or_permission:admin|privates.manage'])->group(function () {
        Route::get('privates/create', [PrivateClassController::class, 'create'])->name('privates.create');
        Route::post('privates', [PrivateClassController::class, 'store'])->name('privates.store');
        Route::get('privates/{private}/edit', [PrivateClassController::class, 'edit'])->name('privates.edit');
        Route::put('privates/{private}', [PrivateClassController::class, 'update'])->name('privates.update');
        Route::delete('privates/{private}', [PrivateClassController::class, 'destroy'])->name('privates.destroy');
        Route::post('/privates/{private}/publish', [PrivateClassController::class, 'publish'])->name('privates.publish');
        Route::post('/privates/{private}/archive', [PrivateClassController::class, 'archive'])->name('privates.archive');
        Route::post('/privates/{private}/duplicate', [PrivateClassController::class, 'duplicate'])->name('privates.duplicate');
    });
    Route::middleware(['role_or_permission:admin|affiliate|privates.view'])->group(function () {
        Route::get('privates', [PrivateClassController::class, 'index'])->name('privates.index');
        Route::get('privates/{private}', [PrivateClassController::class, 'show'])->name('privates.show');
    });

    // Bundles
    Route::middleware(['role_or_permission:admin|bundles.manage'])->group(function () {
        Route::get('bundles/create', [BundleController::class, 'create'])->name('bundles.create');
        Route::post('bundles', [BundleController::class, 'store'])->name('bundles.store');
        Route::get('bundles/{bundle}/edit', [BundleController::class, 'edit'])->name('bundles.edit');
        Route::put('bundles/{bundle}', [BundleController::class, 'update'])->name('bundles.update');
        Route::delete('bundles/{bundle}', [BundleController::class, 'destroy'])->name('bundles.destroy');
        Route::post('/bundles/{bundle}/publish', [BundleController::class, 'publish'])->name('bundles.publish');
        Route::post('/bundles/{bundle}/archive', [BundleController::class, 'archive'])->name('bundles.archive');
        Route::post('/bundles/{bundle}/duplicate', [BundleController::class, 'duplicate'])->name('bundles.duplicate');
    });
    Route::middleware(['role_or_permission:admin|affiliate|bundles.view'])->group(function () {
        Route::get('bundles', [BundleController::class, 'index'])->name('bundles.index');
        Route::get('bundles/{bundle}', [BundleController::class, 'show'])->name('bundles.show');
    });

    // Affiliates & Earnings
    Route::middleware(['role_or_permission:admin|affiliates.manage'])->group(function () {
        Route::get('affiliates/create', [AffiliateController::class, 'create'])->name('affiliates.create');
        Route::post('affiliates', [AffiliateController::class, 'store'])->name('affiliates.store');
        Route::get('affiliates/{affiliate}/edit', [AffiliateController::class, 'edit'])->name('affiliates.edit');
        Route::put('affiliates/{affiliate}', [AffiliateController::class, 'update'])->name('affiliates.update');
        Route::delete('affiliates/{affiliate}', [AffiliateController::class, 'destroy'])->name('affiliates.destroy');
        Route::post('affiliates/{affiliate}/toggle-status', [AffiliateController::class, 'toggleStatus'])->name('affiliates.toggleStatus');
        Route::post('affiliates/{affiliate}/withdraw', [AffiliateController::class, 'withdrawCommission'])->name('affiliates.withdraw');
    });
    Route::middleware(['role_or_permission:admin|affiliates.view'])->group(function () {
        Route::get('affiliates', [AffiliateController::class, 'index'])->name('affiliates.index');
        Route::get('affiliates/{affiliate}', [AffiliateController::class, 'show'])->name('affiliates.show');
    });

    Route::middleware(['role_or_permission:affiliate|mentor|admin|staff'])->group(function () {
        Route::get('affiliate-earnings', [AffiliateEarningController::class, 'index'])->name('earnings.index');
        Route::get('affiliate-earnings/export', [AffiliateEarningController::class, 'export'])->name('earnings.export');
    });
    Route::middleware(['role_or_permission:admin|earnings.manage'])->group(function () {
        Route::post('affiliate-earnings/{earning}/approve', [AffiliateEarningController::class, 'approveEarning'])->name('earnings.approve');
        Route::post('affiliate-earnings/{earning}/reject', [AffiliateEarningController::class, 'rejectEarning'])->name('earnings.reject');
    });

    // Mentors
    Route::middleware(['role_or_permission:admin|mentors.manage'])->group(function () {
        Route::get('mentors/create', [MentorController::class, 'create'])->name('mentors.create');
        Route::post('mentors', [MentorController::class, 'store'])->name('mentors.store');
        Route::get('mentors/{mentor}/edit', [MentorController::class, 'edit'])->name('mentors.edit');
        Route::put('mentors/{mentor}', [MentorController::class, 'update'])->name('mentors.update');
        Route::delete('mentors/{mentor}', [MentorController::class, 'destroy'])->name('mentors.destroy');
        Route::post('/mentors/{mentor}/withdraw', [MentorController::class, 'withdrawCommission'])->name('mentors.withdraw');
    });
    Route::middleware(['role_or_permission:admin|mentors.view'])->group(function () {
        Route::get('mentors', [MentorController::class, 'index'])->name('mentors.index');
        Route::get('mentors/{mentor}', [MentorController::class, 'show'])->name('mentors.show');
    });

    // Discount Codes
    Route::middleware(['role_or_permission:admin|discount-codes.manage'])->group(function () {
        Route::get('discount-codes/create', [DiscountCodeController::class, 'create'])->name('discount-codes.create');
        Route::post('discount-codes', [DiscountCodeController::class, 'store'])->name('discount-codes.store');
        Route::get('discount-codes/{discount_code}/edit', [DiscountCodeController::class, 'edit'])->name('discount-codes.edit');
        Route::put('discount-codes/{discount_code}', [DiscountCodeController::class, 'update'])->name('discount-codes.update');
        Route::delete('discount-codes/{discount_code}', [DiscountCodeController::class, 'destroy'])->name('discount-codes.destroy');
    });
    Route::middleware(['role_or_permission:admin|discount-codes.view'])->group(function () {
        Route::get('discount-codes', [DiscountCodeController::class, 'index'])->name('discount-codes.index');
        Route::get('discount-codes/{discount_code}', [DiscountCodeController::class, 'show'])->name('discount-codes.show');
    });

    // Transactions
    Route::middleware(['role_or_permission:admin|transactions.view'])->group(function () {
        Route::get('transactions', [InvoiceController::class, 'index'])->name('transactions.index');
        Route::get('transactions/export', [InvoiceController::class, 'export'])->name('transactions.export');
    });

    // Promotions
    Route::middleware(['role_or_permission:admin|promotions.manage'])->group(function () {
        Route::get('promotions/create', [PromotionController::class, 'create'])->name('promotions.create');
        Route::post('promotions', [PromotionController::class, 'store'])->name('promotions.store');
        Route::get('promotions/{promotion}/edit', [PromotionController::class, 'edit'])->name('promotions.edit');
        Route::put('promotions/{promotion}', [PromotionController::class, 'update'])->name('promotions.update');
        Route::delete('promotions/{promotion}', [PromotionController::class, 'destroy'])->name('promotions.destroy');
        Route::patch('promotions/{promotion}/toggle-status', [PromotionController::class, 'toggleStatus'])->name('promotions.toggle-status');
    });
    Route::middleware(['role_or_permission:admin|promotions.view'])->group(function () {
        Route::get('promotions', [PromotionController::class, 'index'])->name('promotions.index');
        Route::get('promotions/{promotion}', [PromotionController::class, 'show'])->name('promotions.show');
    });

    // Carousels
    Route::middleware(['role_or_permission:admin|carousels.view'])->group(function () {
        Route::get('carousels', [\App\Http\Controllers\Admin\CarouselAdminController::class, 'index'])->name('carousels.index');
    });
    Route::middleware(['role_or_permission:admin|carousels.manage'])->group(function () {
        Route::post('carousels', [\App\Http\Controllers\Admin\CarouselAdminController::class, 'store'])->name('carousels.store');
        Route::post('carousels/{carousel}/update', [\App\Http\Controllers\Admin\CarouselAdminController::class, 'update'])->name('carousels.update');
        Route::delete('carousels/{carousel}', [\App\Http\Controllers\Admin\CarouselAdminController::class, 'destroy'])->name('carousels.destroy');
        Route::patch('carousels/{carousel}/toggle-status', [\App\Http\Controllers\Admin\CarouselAdminController::class, 'toggleStatus'])->name('carousels.toggle-status');
    });

    // Referral & Reward point admin routes
    Route::middleware(['role_or_permission:admin|referral.view'])->group(function () {
        Route::get('referral/settings', [App\Http\Controllers\Admin\ReferralAdminController::class, 'settings'])->name('admin.referral.settings');
        Route::get('referral/report', [App\Http\Controllers\Admin\ReferralAdminController::class, 'report'])->name('admin.referral.report');
        Route::get('referral/transactions', [App\Http\Controllers\Admin\ReferralAdminController::class, 'transactions'])->name('admin.referral.transactions');
        Route::get('referral/search-users', [App\Http\Controllers\Admin\ReferralAdminController::class, 'searchUsers'])->name('admin.referral.search-users');
    });
    Route::middleware(['role_or_permission:admin|referral.manage'])->group(function () {
        Route::post('referral/settings', [App\Http\Controllers\Admin\ReferralAdminController::class, 'updateSettings'])->name('admin.referral.settings.update');
        Route::post('referral/adjust-points', [App\Http\Controllers\Admin\ReferralAdminController::class, 'adjustPoints'])->name('admin.referral.adjust-points');
    });

    // Installment Term admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('products/{type}/{id}/installments/toggle', [InstallmentTermController::class, 'toggleEnabled'])->name('installments.toggle');
        Route::post('installment-terms', [InstallmentTermController::class, 'store'])->name('installment-terms.store');
        Route::put('installment-terms/{id}', [InstallmentTermController::class, 'update'])->name('installment-terms.update');
        Route::delete('installment-terms/{id}', [InstallmentTermController::class, 'destroy'])->name('installment-terms.destroy');
        Route::post('installments/{id}/send-reminder', [InstallmentController::class, 'sendReminder'])->name('installments.send-reminder');
    });
});

Route::post('/api/discount-codes/validate', [DiscountCodeController::class, 'validate'])->name('api.discount-codes.validate');

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

Route::fallback(function () {
    return Inertia::render('errors/not-found');
});
